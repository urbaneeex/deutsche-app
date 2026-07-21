import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { todayStr, daysBetween } from "@/lib/date";

export async function getOrCreateProfile(userId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({ id: userId, streak_count: 0 })
    .select("*")
    .single();
  if (insertError) throw insertError;
  return created;
}

/**
 * Marca actividad de hoy y actualiza la racha:
 * - si ya estuvo activo hoy, no cambia nada
 * - si estuvo activo ayer, suma 1
 * - si no, la racha vuelve a empezar en 1
 */
export async function markActiveToday(userId: string) {
  const profile = await getOrCreateProfile(userId);
  const today = todayStr();

  if (profile.last_active_date === today) return profile;

  const diff = profile.last_active_date
    ? daysBetween(profile.last_active_date, today)
    : null;
  const newStreak = diff === 1 ? profile.streak_count + 1 : 1;

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ streak_count: newStreak, last_active_date: today })
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
