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
      /** Id de la tarjeta que se está practicando (repaso automático). */
      ref?: string;
    }
  | {
      kind: "type";
      prompt: string;
      answer: string;
      explanation?: string;
      audio?: string;
      ref?: string;
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

/** Un ejercicio para una tarjeta. `slot` rota el tipo (0 escuchar, 1
 * traducir, 2 artículo, 3 escribir); `pool` aporta las opciones falsas. */
export function exerciseForCard(card: Card, pool: Card[], slot: number): Exercise {
  const full = withArticle(card);
  const translations = pool.map((c) => c.translation);
  const words = pool.map(withArticle);
  const enough = translations.filter((t) => t !== card.translation).length >= 3;
  const kind = enough ? slot % 4 : 3;

  if (kind === 0) {
    return {
      kind: "choice",
      listen: true,
      audio: full,
      ref: card.id,
      prompt: "¿Qué significa lo que oyes?",
      answer: card.translation,
      choices: shuffle([card.translation, ...distractors(translations, card.translation, 3)]),
      explanation: `${full} = ${card.translation}`,
    };
  }
  if (kind === 1) {
    return {
      kind: "choice",
      ref: card.id,
      prompt: `¿Cómo se dice «${card.translation}» en alemán?`,
      answer: full,
      choices: shuffle([full, ...distractors(words, full, 3)]),
      explanation: card.example_sentence
        ? `${card.example_sentence} — ${card.example_translation ?? ""}`
        : undefined,
    };
  }
  if (kind === 2 && card.article) {
    return {
      kind: "choice",
      ref: card.id,
      prompt: `___ ${card.word} (${card.translation})`,
      answer: card.article,
      choices: ["der", "die", "das"],
      explanation: `${full} — aprende siempre el artículo con la palabra.`,
    };
  }
  return {
    kind: "type",
    ref: card.id,
    prompt: `Escribe en alemán: «${card.translation}»`,
    answer: full,
    explanation: card.example_sentence ?? undefined,
  };
}

/** Ejercicios generados a partir de las tarjetas del paso. */
export function buildCardExercises(cards: Card[], max = 8): Exercise[] {
  if (cards.length < 2) return [];
  return shuffle(cards)
    .slice(0, max)
    .map((card, i) => exerciseForCard(card, cards, i));
}
