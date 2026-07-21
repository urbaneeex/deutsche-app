import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const AUDIO_BUCKET = "pronunciation-audio";

/** Sube el audio grabado a Storage, en una carpeta propia del usuario, y
 * devuelve la ruta guardada (no la URL: el bucket es privado). */
export async function uploadPronunciationAudio(userId: string, blob: Blob) {
  const supabase = getSupabaseBrowserClient();
  const path = `${userId}/${Date.now()}.webm`;
  const { error } = await supabase.storage
    .from(AUDIO_BUCKET)
    .upload(path, blob, { contentType: "audio/webm" });
  if (error) throw error;
  return path;
}

/** URL temporal para reproducir un audio guardado (el bucket no es público). */
export async function getPronunciationAudioUrl(path: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.storage
    .from(AUDIO_BUCKET)
    .createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}

export async function savePronunciationAttempt(
  userId: string,
  phrase: string,
  transcript: string | null,
  isMatch: boolean | null,
  audioPath: string | null = null
) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("pronunciation_attempts").insert({
    user_id: userId,
    phrase,
    transcript,
    is_match: isMatch,
    audio_path: audioPath,
  });
  if (error) throw error;
}

export async function getRecentPronunciationAttempts(userId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("pronunciation_attempts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(15);
  if (error) throw error;
  return data ?? [];
}
