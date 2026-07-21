import type { LessonProgress, SrsState } from "@/lib/types/database";

export type MasteryLevel =
  | "sin_empezar"
  | "necesita_mejorar"
  | "mejora"
  | "fuerte"
  | "dominado";

export const MASTERY_META: Record<
  MasteryLevel,
  { label: string; dotClass: string; textClass: string; strokeClass: string }
> = {
  sin_empezar: {
    label: "Por aprender",
    dotClass: "bg-stone-600",
    textClass: "text-stone-500",
    strokeClass: "stroke-stone-600",
  },
  necesita_mejorar: {
    label: "Necesita mejorar",
    dotClass: "bg-rose-500",
    textClass: "text-rose-400",
    strokeClass: "stroke-rose-500",
  },
  mejora: {
    label: "Mejora",
    dotClass: "bg-amber-500",
    textClass: "text-amber-400",
    strokeClass: "stroke-amber-500",
  },
  fuerte: {
    label: "Fuerte",
    dotClass: "bg-sky-500",
    textClass: "text-sky-400",
    strokeClass: "stroke-sky-500",
  },
  dominado: {
    label: "Dominado",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-400",
    strokeClass: "stroke-emerald-500",
  },
};

/** Niveles que cuentan como "ya empezado" a la hora de repartir la dona. */
export const STARTED_LEVELS: MasteryLevel[] = [
  "necesita_mejorar",
  "mejora",
  "fuerte",
  "dominado",
];

export function classifyGrammarMastery(
  progress: LessonProgress | null | undefined
): MasteryLevel {
  if (!progress) return "sin_empezar";
  const { score } = progress;
  if (score >= 1) return "dominado";
  if (score >= 0.85) return "fuerte";
  if (score >= 0.6) return "mejora";
  return "necesita_mejorar";
}

export function classifyVocabMastery(
  state: SrsState | null | undefined
): MasteryLevel {
  if (!state) return "sin_empezar";
  const { repetitions } = state;
  if (repetitions >= 4) return "dominado";
  if (repetitions >= 2) return "fuerte";
  if (repetitions >= 1) return "mejora";
  return "necesita_mejorar";
}

export function countByMastery(levels: MasteryLevel[]) {
  const counts: Record<MasteryLevel, number> = {
    sin_empezar: 0,
    necesita_mejorar: 0,
    mejora: 0,
    fuerte: 0,
    dominado: 0,
  };
  for (const level of levels) counts[level]++;
  return counts;
}
