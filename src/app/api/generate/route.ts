import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  formatAIError,
  getAIClient,
  getAIModel,
  getAIProvider,
} from "@/lib/ai";
import type { Article, DialogueStep } from "@/lib/types/database";

export const dynamic = "force-dynamic";

interface HistoryTurn {
  speaker: string;
  text_de: string;
}

interface GenerateBody {
  type:
    | "situation"
    | "situation-reply"
    | "flashcards"
    | "flashcards-expand"
    | "pronunciation-feedback";
  topic?: string;
  level?: string;
  count?: number;
  deckId?: string;
  phrase?: string;
  transcript?: string;
  situationTitle?: string;
  situationContext?: string;
  history?: HistoryTurn[];
  userMessage?: string;
}

const situationSchemaHint = `{
  "title": string (aleman),
  "level": "A1"|"A2"|"B1"|"B2"|"C1",
  "description": string (en español, una frase),
  "dialogue": [
    { "speaker": string, "text_de": string, "text_es": string, "options": [ { "text_de": string, "next": number } ] }
  ]
}`;

const situationReplySchemaHint = `{
  "correction": { "has_issues": boolean, "corrected": string|null (la frase del alumno corregida en aleman, null si no hay errores), "explanation": string|null (en español, 1 frase muy breve explicando el fallo principal, null si no hay errores) },
  "reply": { "speaker": string (el mismo personaje u otro coherente con la escena), "text_de": string (respuesta natural en aleman, 1 a 2 frases), "text_es": string (traduccion al español) },
  "options": string[] (exactamente 3 posibles respuestas del alumno en aleman para el siguiente turno; deben sonar naturales y no ser triviales: al menos una debe ser una opcion sutilmente incorrecta o menos adecuada -ej. registro informal cuando toca formal, caso o articulo equivocado, orden de palabras raro- para que el alumno tenga que pensar, pero sin ser un error absurdo obvio),
  "vocab": [ { "word": string (aleman, sin articulo), "article": "der"|"die"|"das"|null, "translation": string (español) } ] (0 a 3 palabras clave nuevas usadas en tu respuesta "reply")
}`;

const flashcardsSchemaHint = `{
  "deckTitle": string (español, corto, ej. "Ropa y moda"),
  "cards": [
    {
      "word": string (SOLO la palabra o expresion en aleman, SIN el articulo delante, con mayuscula si es sustantivo. Ejemplo correcto: "Internet". Ejemplo INCORRECTO: "das Internet"),
      "article": "der" | "die" | "das" | null (null si no es un sustantivo; el articulo va SOLO aqui, nunca dentro de "word"),
      "gender": "masculino" | "femenino" | "neutro" | null,
      "translation": string (español, sin articulo),
      "example_sentence": string (frase natural en aleman usando la palabra, aqui si puedes usar el articulo dentro de la frase),
      "example_translation": string (traduccion al español de la frase),
      "tags": string[] (1 a 2 etiquetas cortas en español, ej. ["ropa"])
    }
  ]
}`;

/** Algunos modelos (sobre todo los mas pequenos) repiten el articulo dentro
 * de "word" a pesar de las instrucciones (ej. word="das Internet",
 * article="das"), lo que duplica el articulo al mostrar la tarjeta. Esto lo
 * corrige quitando el prefijo si coincide con el articulo declarado. */
function stripDuplicateArticle(word: string, article: Article): string {
  if (!article) return word.trim();
  const trimmed = word.trim();
  const prefix = `${article} `;
  if (trimmed.toLowerCase().startsWith(prefix.toLowerCase())) {
    return trimmed.slice(prefix.length).trim();
  }
  return trimmed;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: Request) {
  const provider = getAIProvider();
  if (!provider) {
    return NextResponse.json(
      {
        error:
          "Falta GROQ_API_KEY (recomendado) u OPENAI_API_KEY en .env.local.",
      },
      { status: 500 }
    );
  }

  let body: GenerateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const ai = getAIClient();
  const model = getAIModel(provider);
  const supabase = getSupabaseAdminClient();

  try {
    if (body.type === "situation") {
      const topic = body.topic?.trim();
      const level = body.level ?? "A2";

      const completion = await ai.chat.completions.create({
        model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Eres un guionista de diálogos didácticos para aprender alemán en situaciones reales de la vida en Alemania (trámites, tiendas, trabajo, vida social). Crea diálogos realistas, cortos (4 a 6 turnos), en alemán natural con traducción al español, y con opciones de respuesta ramificadas cuando el usuario tiene que elegir qué decir. Las opciones de respuesta NO deben ser triviales: dale 2 o 3 opciones plausibles donde al menos una suene bien pero tenga un matiz incorrecto o menos adecuado (registro equivocado, caso o artículo erróneo, orden de palabras raro, falso amigo), para obligar al alumno a pensar en vez de adivinar por descarte obvio. El campo 'next' de cada opción es el índice (0-based) del siguiente elemento del array 'dialogue'. El último paso del diálogo no debe tener 'options'. Responde solo JSON con este formato exacto: " +
              situationSchemaHint,
          },
          {
            role: "user",
            content: `Genera una situación de nivel ${level} sobre: ${
              topic || "una situación cotidiana útil para alguien que vive en Alemania"
            }.`,
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error("Respuesta vacía del modelo.");
      const parsed = JSON.parse(raw) as {
        title: string;
        level: string;
        description: string;
        dialogue: DialogueStep[];
      };

      const slug = `${slugify(parsed.title)}-${Date.now().toString(36)}`;

      const { data, error } = await supabase
        .from("situations")
        .insert({
          slug,
          title: parsed.title,
          level: parsed.level,
          description: parsed.description,
          dialogue: parsed.dialogue,
          source: "ai",
        })
        .select("*")
        .single();
      if (error) throw error;

      return NextResponse.json({ inserted: data });
    }

    if (body.type === "situation-reply") {
      const userMessage = body.userMessage?.trim();
      if (!userMessage) {
        return NextResponse.json(
          { error: "Falta el mensaje del alumno." },
          { status: 400 }
        );
      }
      const situationTitle = body.situationTitle?.trim() || "Conversación en Alemania";
      const situationContext = body.situationContext?.trim() || "";
      const history = (body.history ?? []).slice(-10);
      const historyText =
        history.map((h) => `${h.speaker}: ${h.text_de}`).join("\n") || "(inicio de la conversación)";

      const completion = await ai.chat.completions.create({
        model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Eres el/los personaje(s) de un juego de rol para practicar aleman conversacional real con un hispanohablante que vive en Alemania. Mantienes la escena "' +
              situationTitle +
              '"' +
              (situationContext ? ` (${situationContext})` : "") +
              ". Responde SIEMPRE en tu papel de personaje, de forma natural y breve (1-2 frases), continuando la conversacion de forma coherente con el historial. Antes de responder, revisa la ULTIMA frase que escribio el alumno: si tiene errores claros de gramatica, orden, articulo, caso o vocabulario, marca has_issues=true y da la version corregida y una explicacion muy breve en español; si esta bien (aunque sea sencilla), has_issues=false y corrected/explanation en null. No seas quisquilloso con errores triviales de puntuacion o mayusculas. Responde solo JSON con este formato exacto: " +
              situationReplySchemaHint,
          },
          {
            role: "user",
            content: `Historial de la conversación:\n${historyText}\n\nEl alumno acaba de escribir: "${userMessage}"`,
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error("Respuesta vacía del modelo.");
      const parsed = JSON.parse(raw) as {
        correction: {
          has_issues: boolean;
          corrected: string | null;
          explanation: string | null;
        };
        reply: { speaker: string; text_de: string; text_es: string };
        options: string[];
        vocab: { word: string; article: Article; translation: string }[];
      };

      return NextResponse.json(parsed);
    }

    if (body.type === "flashcards") {
      const topic = body.topic?.trim();
      if (!topic) {
        return NextResponse.json(
          { error: "Indica un tema para generar las tarjetas (ej. \"ropa\")." },
          { status: 400 }
        );
      }
      const count = Math.min(Math.max(body.count ?? 8, 4), 15);

      const completion = await ai.chat.completions.create({
        model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Eres un profesor nativo de aleman que crea tarjetas de vocabulario para un hispanohablante que vive en Alemania. Las palabras deben ser de uso real y cotidiano, con el articulo correcto cuando sea un sustantivo, una frase de ejemplo natural y su traduccion. Adapta la dificultad al tema de forma natural (no fuerces un nivel CEFR concreto). IMPORTANTE: el campo "word" NUNCA debe incluir el articulo (der/die/das); el articulo va SOLO en el campo "article", separado. Por ejemplo, para "das Internet" debes devolver word="Internet" y article="das", nunca word="das Internet". Responde solo JSON con este formato exacto: ' +
              flashcardsSchemaHint,
          },
          {
            role: "user",
            content: `Genera ${count} tarjetas de vocabulario sobre el tema: "${topic}".`,
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error("Respuesta vacía del modelo.");
      const parsed = JSON.parse(raw) as {
        deckTitle: string;
        cards: {
          word: string;
          article: Article;
          gender: string | null;
          translation: string;
          example_sentence: string;
          example_translation: string;
          tags: string[];
        }[];
      };

      if (!parsed.cards?.length) throw new Error("El modelo no devolvió tarjetas.");

      const slug = `${slugify(parsed.deckTitle || topic)}-${Date.now().toString(36)}`;
      const { data: deck, error: deckError } = await supabase
        .from("decks")
        .insert({
          slug,
          level: "general",
          category: "vocab",
          topic: "Generadas por IA",
          title: parsed.deckTitle || topic,
          description: `Generado con IA a partir de: "${topic}".`,
          source: "ai",
        })
        .select("*")
        .single();
      if (deckError) throw deckError;

      const { data: cards, error: cardsError } = await supabase
        .from("cards")
        .insert(
          parsed.cards.map((c, i) => ({
            ...c,
            word: stripDuplicateArticle(c.word, c.article),
            deck_id: deck.id,
            sort_order: i,
          }))
        )
        .select("*");
      if (cardsError) throw cardsError;

      return NextResponse.json({ deck, cards });
    }

    if (body.type === "flashcards-expand") {
      const deckId = body.deckId?.trim();
      if (!deckId) {
        return NextResponse.json(
          { error: "Falta el id del mazo a ampliar." },
          { status: 400 }
        );
      }

      const { data: deck, error: deckReadError } = await supabase
        .from("decks")
        .select("*")
        .eq("id", deckId)
        .single();
      if (deckReadError || !deck) {
        return NextResponse.json({ error: "Mazo no encontrado." }, { status: 404 });
      }

      const { data: existingCards, error: cardsReadError } = await supabase
        .from("cards")
        .select("word, article, sort_order")
        .eq("deck_id", deckId)
        .order("sort_order");
      if (cardsReadError) throw cardsReadError;

      const count = Math.min(Math.max(body.count ?? 8, 4), 15);
      const existingWords = (existingCards ?? [])
        .map((c) => (c.article ? `${c.article} ${c.word}` : c.word))
        .join(", ");
      const nextSort = (existingCards?.length ?? 0);
      const aiTopic = deck.description?.match(/^Generado con IA a partir de: "(.+)"\.$/)?.[1];
      const topic = aiTopic ?? deck.title;
      const context = deck.description && !aiTopic ? deck.description : "";

      const completion = await ai.chat.completions.create({
        model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Eres un profesor nativo de aleman que crea tarjetas de vocabulario para un hispanohablante que vive en Alemania. Las palabras deben ser de uso real y cotidiano, con el articulo correcto cuando sea un sustantivo, una frase de ejemplo natural y su traduccion. IMPORTANTE: el campo "word" NUNCA debe incluir el articulo (der/die/das); el articulo va SOLO en el campo "article", separado. NO repitas palabras que ya existen en el mazo. Responde solo JSON con este formato exacto: ' +
              flashcardsSchemaHint,
          },
          {
            role: "user",
            content: `El mazo "${deck.title}" trata de: "${topic}".${context ? ` Contexto: ${context}.` : ""} Ya tiene estas palabras: ${existingWords || "(ninguna)"}. Genera ${count} tarjetas NUEVAS y diferentes sobre el mismo tema, sin repetir ninguna de las existentes.`,
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error("Respuesta vacía del modelo.");
      const parsed = JSON.parse(raw) as {
        cards: {
          word: string;
          article: Article;
          gender: string | null;
          translation: string;
          example_sentence: string;
          example_translation: string;
          tags: string[];
        }[];
      };

      if (!parsed.cards?.length) throw new Error("El modelo no devolvió tarjetas.");

      const existingSet = new Set(
        (existingCards ?? []).map((c) => c.word.toLowerCase())
      );
      const newCards = parsed.cards.filter(
        (c) => !existingSet.has(stripDuplicateArticle(c.word, c.article).toLowerCase())
      );
      if (!newCards.length) {
        throw new Error("La IA no generó palabras nuevas. Prueba de nuevo.");
      }

      const { data: cards, error: cardsError } = await supabase
        .from("cards")
        .insert(
          newCards.map((c, i) => ({
            ...c,
            word: stripDuplicateArticle(c.word, c.article),
            deck_id: deckId,
            sort_order: nextSort + i,
          }))
        )
        .select("*");
      if (cardsError) throw cardsError;

      return NextResponse.json({ deck, cards, added: cards?.length ?? 0 });
    }

    if (body.type === "pronunciation-feedback") {
      const phrase = body.phrase?.trim();
      if (!phrase) {
        return NextResponse.json(
          { error: "Falta la frase objetivo." },
          { status: 400 }
        );
      }
      const transcript = body.transcript?.trim();

      const completion = await ai.chat.completions.create({
        model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Eres un profesor nativo de aleman, experto en fonetica, que ayuda a hispanohablantes a mejorar su pronunciacion. Te doy una frase objetivo en aleman y lo que el reconocimiento de voz del navegador transcribio de un intento real del alumno al decirla en voz alta (puede tener errores de reconocimiento, usalo solo como pista de que sonidos pudo fallar, no lo tomes literal al 100%). Da entre 2 y 4 consejos MUY concretos, breves y accionables en español sobre los sonidos alemanes de esa frase que suelen costarle a un hispanohablante (ej. la "ü", la "ö", la "ch", la "r" alemana, los diptongos, la entonacion, las vocales largas/cortas) y como corregirlos con la boca/lengua. Si el intento coincide bien con el objetivo, felicita brevemente y da igualmente 1 consejo de refinamiento. Responde solo JSON con este formato exacto: { "tips": string[] }',
          },
          {
            role: "user",
            content: `Frase objetivo: "${phrase}"\nTranscripción del intento: "${
              transcript || "(no se detectó voz)"
            }"`,
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error("Respuesta vacía del modelo.");
      const parsed = JSON.parse(raw) as { tips: string[] };

      return NextResponse.json({ tips: parsed.tips ?? [] });
    }

    return NextResponse.json({ error: "Tipo no soportado." }, { status: 400 });
  } catch (err) {
    console.error("Error en /api/generate:", err);
    return NextResponse.json({ error: formatAIError(err) }, { status: 500 });
  }
}
