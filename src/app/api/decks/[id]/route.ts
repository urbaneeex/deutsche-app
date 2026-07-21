import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

async function getDeck(id: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("decks")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data;
}

export async function PATCH(req: Request, context: RouteContext) {
  const { id } = await context.params;

  let body: { title?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: "Indica un título." }, { status: 400 });
  }

  const deck = await getDeck(id);
  if (!deck) {
    return NextResponse.json({ error: "Mazo no encontrado." }, { status: 404 });
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("decks")
    .update({ title })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;

  return NextResponse.json({ deck: data });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { id } = await context.params;

  const deck = await getDeck(id);
  if (!deck) {
    return NextResponse.json({ error: "Mazo no encontrado." }, { status: 404 });
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("decks").delete().eq("id", id);
  if (error) throw error;

  return NextResponse.json({ ok: true });
}
