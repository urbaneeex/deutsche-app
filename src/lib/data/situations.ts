import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export async function getSituations() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("situations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getSituationBySlug(slug: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("situations")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) throw error;
  return data;
}
