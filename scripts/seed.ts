/**
 * Carga el contenido semilla (src/data/seed/*.json) en Supabase.
 * Uso: npm run db:seed
 * Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import decks from "../src/data/seed/decks.json";
import cardsSeed from "../src/data/seed/cards.json";
import grammarLessons from "../src/data/seed/grammar-lessons.json";
import situations from "../src/data/seed/situations.json";
import pathStepsSeed from "../src/data/seed/path-steps.json";

function loadDotEnvLocal() {
  const path = resolve(__dirname, "../.env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Configura .env.local (ver .env.example)."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

async function main() {
  console.log("-> Sembrando decks...");
  const { error: decksError } = await supabase
    .from("decks")
    .upsert(decks, { onConflict: "slug" });
  if (decksError) throw decksError;

  const { data: deckRows, error: deckReadError } = await supabase
    .from("decks")
    .select("id, slug");
  if (deckReadError) throw deckReadError;
  const deckSlugToId = new Map(deckRows.map((d) => [d.slug, d.id]));

  console.log("-> Sembrando cards...");
  const cardsToInsert = cardsSeed.map(({ deckSlug, ...card }) => {
    const deckId = deckSlugToId.get(deckSlug);
    if (!deckId) throw new Error(`Deck no encontrado: ${deckSlug}`);
    return { ...card, deck_id: deckId };
  });
  // Las cards no tienen slug unico; para poder re-ejecutar el seed sin
  // duplicar, borramos las cards de los decks semilla y las reinsertamos.
  const { error: deleteCardsError } = await supabase
    .from("cards")
    .delete()
    .in("deck_id", Array.from(deckSlugToId.values()));
  if (deleteCardsError) throw deleteCardsError;
  const { error: cardsError } = await supabase
    .from("cards")
    .insert(cardsToInsert);
  if (cardsError) throw cardsError;

  console.log("-> Sembrando lecciones de gramática...");
  const { error: lessonsError } = await supabase
    .from("grammar_lessons")
    .upsert(grammarLessons, { onConflict: "slug" });
  if (lessonsError) throw lessonsError;

  console.log("-> Sembrando situaciones...");
  const { error: situationsError } = await supabase
    .from("situations")
    .upsert(
      situations.map((s) => ({ ...s, source: "seed" })),
      { onConflict: "slug" }
    );
  if (situationsError) throw situationsError;

  console.log("-> Sembrando pasos de la ruta de aprendizaje...");
  const pathStepsToUpsert = pathStepsSeed.map(({ deckSlug, ...step }) => ({
    ...step,
    deck_id: deckSlug ? deckSlugToId.get(deckSlug) ?? null : null,
  }));
  const { error: pathStepsError } = await supabase
    .from("path_steps")
    .upsert(pathStepsToUpsert, { onConflict: "slug" });
  if (pathStepsError) throw pathStepsError;

  console.log("Listo. Contenido semilla cargado correctamente.");
}

main().catch((err) => {
  console.error("Error al sembrar la base de datos:", err);
  process.exit(1);
});
