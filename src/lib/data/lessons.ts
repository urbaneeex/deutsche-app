import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export async function getGrammarLessons() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("grammar_lessons")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function getGrammarLessonBySlug(slug: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("grammar_lessons")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) throw error;
  return data;
}

export async function getCompletedLessonIds(userId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.lesson_id));
}

export async function getLessonProgressMap(userId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return new Map((data ?? []).map((p) => [p.lesson_id, p]));
}

/** Guarda el resultado de un intento. Cada repeticion actualiza la
 * puntuacion (para reflejar el dominio real, no solo si se hizo una vez) y
 * suma un intento. */
export async function markLessonComplete(
  userId: string,
  lessonId: string,
  score: number
) {
  const supabase = getSupabaseBrowserClient();
  const { data: existing, error: readError } = await supabase
    .from("lesson_progress")
    .select("attempts")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (readError) throw readError;

  const { error } = await supabase.from("lesson_progress").upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      score,
      attempts: (existing?.attempts ?? 0) + 1,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" }
  );
  if (error) throw error;
}
