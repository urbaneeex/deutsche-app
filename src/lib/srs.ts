/**
 * Algoritmo SM-2 (SuperMemo 2) para repetición espaciada.
 * Referencia: https://super-memory.com/english/ol/sm2.htm
 */

export type ReviewQuality = 0 | 3 | 4 | 5;

export const REVIEW_BUTTONS: { label: string; quality: ReviewQuality }[] = [
  { label: "Otra vez", quality: 0 },
  { label: "Difícil", quality: 3 },
  { label: "Bien", quality: 4 },
  { label: "Fácil", quality: 5 },
];

export interface SrsInput {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
}

export interface SrsResult {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  dueAt: Date;
}

const MIN_EASE_FACTOR = 1.3;

export function reviewCard(
  state: SrsInput,
  quality: ReviewQuality,
  now: Date = new Date()
): SrsResult {
  let { easeFactor, intervalDays, repetitions } = state;

  if (quality < 3) {
    repetitions = 0;
    intervalDays = 0 as number;
    // Reintentar en unos minutos representados como fracción de día.
    const dueAt = new Date(now.getTime() + 10 * 60 * 1000);
    return { easeFactor, intervalDays: 0, repetitions, dueAt };
  }

  repetitions += 1;

  if (repetitions === 1) {
    intervalDays = 1;
  } else if (repetitions === 2) {
    intervalDays = 6;
  } else {
    intervalDays = Math.round(intervalDays * easeFactor);
  }

  easeFactor =
    easeFactor +
    (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < MIN_EASE_FACTOR) easeFactor = MIN_EASE_FACTOR;

  const dueAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  return { easeFactor, intervalDays, repetitions, dueAt };
}

export function createInitialSrsState(): SrsInput {
  return { easeFactor: 2.5, intervalDays: 0, repetitions: 0 };
}
