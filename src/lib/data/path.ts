import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PathStep } from "@/lib/types/database";

export const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1"] as const;

/** Puntuacion minima para aprobar un paso de tipo "exam" y desbloquear el
 * siguiente paso de la ruta. */
export const EXAM_PASS_SCORE = 0.7;

let stepsCache: PathStep[] | null = null;
let stepsInFlight: Promise<PathStep[]> | null = null;

/** Los pasos casi nunca cambian: se cachean en memoria (navegar entre
 * Aprender y una lección ya no repite la consulta). */
export function getPathSteps(): Promise<PathStep[]> {
  if (stepsCache) return Promise.resolve(stepsCache);
  stepsInFlight ??= fetchPathSteps()
    .then((steps) => (stepsCache = steps))
    .finally(() => (stepsInFlight = null));
  return stepsInFlight;
}

async function fetchPathSteps(): Promise<PathStep[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("path_steps")
    .select("*")
    .order("level")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function getPathStepBySlug(slug: string): Promise<PathStep> {
  const cached = stepsCache?.find((s) => s.slug === slug);
  if (cached) return cached;
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("path_steps")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) throw error;
  return data;
}

export async function getCompletedStepIds(userId: string): Promise<Set<string>> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("path_progress")
    .select("step_id")
    .eq("user_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.step_id));
}

/** Guarda un paso como completado con su puntuacion real. Para examenes,
 * solo se debe llamar cuando la puntuacion supera EXAM_PASS_SCORE: mientras
 * no exista fila en path_progress, el paso sigue sin desbloquear el
 * siguiente (ver isStepUnlocked). */
export async function markStepComplete(
  userId: string,
  stepId: string,
  score = 1
) {
  const supabase = getSupabaseBrowserClient();
  const { data: existing, error: readError } = await supabase
    .from("path_progress")
    .select("attempts")
    .eq("user_id", userId)
    .eq("step_id", stepId)
    .maybeSingle();
  if (readError) throw readError;

  const { error } = await supabase.from("path_progress").upsert(
    {
      user_id: userId,
      step_id: stepId,
      score,
      attempts: (existing?.attempts ?? 0) + 1,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,step_id" }
  );
  if (error) throw error;
}

export interface LevelSummary {
  level: string;
  steps: PathStep[];
  completedCount: number;
  percent: number;
  available: boolean;
}

export function summarizeLevels(
  allSteps: PathStep[],
  completedIds: Set<string>
): LevelSummary[] {
  return LEVEL_ORDER.map((level) => {
    const steps = allSteps.filter((s) => s.level === level);
    const completedCount = steps.filter((s) => completedIds.has(s.id)).length;
    const percent = steps.length === 0 ? 0 : Math.round((completedCount / steps.length) * 100);
    return { level, steps, completedCount, percent, available: steps.length > 0 };
  });
}

/** Un paso esta desbloqueado si es el primero, ya esta completado, o el anterior del mismo nivel ya se completo. */
export function isStepUnlocked(
  steps: PathStep[],
  index: number,
  completedIds: Set<string>
): boolean {
  if (index === 0) return true;
  if (completedIds.has(steps[index].id)) return true;
  return completedIds.has(steps[index - 1].id);
}
