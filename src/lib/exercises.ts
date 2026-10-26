import type { Card, GrammarExercise } from "@/lib/types/database";
import { shuffle } from "@/lib/feedback";

export type Exercise =
  | {
      kind: "choice";
      prompt: string;
      choices: string[];
      answer: string;
      explanation?: string;
      /** Texto alemán que se reproduce con el botón de audio. */
      audio?: string;
      /** Si es de escucha, el prompt no debe revelar la palabra. */
      listen?: boolean;
    }
  | {
      kind: "type";
      prompt: string;
      answer: string;
      explanation?: string;
      audio?: string;
    };

export function fromGrammar(ex: GrammarExercise): Exercise {
  return {
    kind: "choice",
    prompt: ex.prompt,
    choices: shuffle(ex.choices ?? []),
    answer: ex.answer,
    explanation: ex.explanation,
  };
}

function withArticle(card: Card) {
  return card.article ? `${card.article} ${card.word}` : card.word;
}

function distractors<T>(pool: T[], correct: T, n: number): T[] {
  return shuffle(pool.filter((x) => x !== correct)).slice(0, n);
}

/** Normaliza para comparar lo escrito: sin mayúsculas, sin signos y
 * tolerante con ä/ö/ü/ß escritos como ae/oe/ue/ss (teclado de móvil). */
export function normalizeAnswer(text: string) {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[.,!?¿¡;:"'()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isTypedCorrect(input: string, answer: string) {
  const given = normalizeAnswer(input);
  if (!given) return false;
  if (given === normalizeAnswer(answer)) return true;
  // Acepta el sustantivo sin artículo ("Tisch" por "der Tisch").
  const stripped = normalizeAnswer(answer).replace(/^(der|die|das) /, "");
  return given === stripped;
}

/** Ejercicios generados a partir de las tarjetas del paso: escuchar,
 * traducir, artículo y escribir. Así se practica de verdad el vocabulario
 * en vez de solo "verlo". */
export function buildCardExercises(cards: Card[], max = 8): Exercise[] {
  if (cards.length < 2) return [];
  const sample = shuffle(cards).slice(0, max);
  const exercises: Exercise[] = [];
  const translations = cards.map((c) => c.translation);
  const words = cards.map(withArticle);

  sample.forEach((card, i) => {
    const full = withArticle(card);
    const slot = i % 4;

    if (slot === 0) {
      exercises.push({
        kind: "choice",
        listen: true,
        audio: full,
        prompt: "¿Qué significa lo que oyes?",
        answer: card.translation,
        choices: shuffle([card.translation, ...distractors(translations, card.translation, 3)]),
        explanation: `${full} = ${card.translation}`,
      });
    } else if (slot === 1) {
      exercises.push({
        kind: "choice",
        prompt: `¿Cómo se dice «${card.translation}» en alemán?`,
        answer: full,
        audio: full,
        choices: shuffle([full, ...distractors(words, full, 3)]),
        explanation: card.example_sentence
          ? `${card.example_sentence} — ${card.example_translation ?? ""}`
          : undefined,
      });
    } else if (slot === 2 && card.article) {
      exercises.push({
        kind: "choice",
        prompt: `___ ${card.word} (${card.translation})`,
        answer: card.article,
        choices: ["der", "die", "das"],
        explanation: `${full} — aprende siempre el artículo con la palabra.`,
      });
    } else {
      exercises.push({
        kind: "type",
        prompt: `Escribe en alemán: «${card.translation}»`,
        answer: full,
        audio: full,
        explanation: card.example_sentence ?? undefined,
      });
    }
  });

  return exercises;
}
