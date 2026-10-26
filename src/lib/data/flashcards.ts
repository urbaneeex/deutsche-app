import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Card, Deck, SrsState } from "@/lib/types/database";
import { createInitialSrsState, reviewCard, type ReviewQuality } from "@/lib/srs";

export interface CardWithState extends Card {
  deck?: Deck;
  state: SrsState | null;
  isDue: boolean;
  isNew: boolean;
}

export async function getAllDecksWithCards() {
  const supabase = getSupabaseBrowserClient();
  const [{ data: decks, error: decksError }, { data: cards, error: cardsError }] =
    await Promise.all([
      supabase.from("decks").select("*").order("sort_order"),
      supabase.from("cards").select("*").order("sort_order"),
    ]);
  if (decksError) throw decksError;
  if (cardsError) throw cardsError;
  return { decks: decks ?? [], cards: cards ?? [] };
}

export async function getReviewQueue(userId: string, limit = 20, newLimit = Infinity) {
  const supabase = getSupabaseBrowserClient();
  const { decks, cards } = await getAllDecksWithCards();
  const { data: states, error: statesError } = await supabase
    .from("srs_state")
    .select("*")
    .eq("user_id", userId);
  if (statesError) throw statesError;

  const deckById = new Map(decks.map((d) => [d.id, d]));
  const stateByCard = new Map((states ?? []).map((s) => [s.card_id, s]));
  const now = Date.now();

  const withState: CardWithState[] = cards.map((card) => {
    const state = stateByCard.get(card.id) ?? null;
    const isNew = !state;
    const isDue = isNew || new Date(state!.due_at).getTime() <= now;
    return { ...card, deck: deckById.get(card.deck_id), state, isDue, isNew };
  });

  const due = withState.filter((c) => c.isDue && !c.isNew);
  const fresh = withState.filter((c) => c.isNew);

  return [...due, ...fresh.slice(0, newLimit)].slice(0, limit);
}

/** Todas las tarjetas de un mazo (categoría) concreto, en orden, para
 * poder recorrerlas libremente en vez de solo las que tocan hoy. */
export async function getDeckQueue(userId: string, deckId: string) {
  const supabase = getSupabaseBrowserClient();
  const [{ decks, cards }, { data: states, error: statesError }] =
    await Promise.all([
      getAllDecksWithCards(),
      supabase.from("srs_state").select("*").eq("user_id", userId),
    ]);
  if (statesError) throw statesError;

  const deckById = new Map(decks.map((d) => [d.id, d]));
  const stateByCard = new Map((states ?? []).map((s) => [s.card_id, s]));
  const now = Date.now();

  const withState: CardWithState[] = cards
    .filter((c) => c.deck_id === deckId)
    .map((card) => {
      const state = stateByCard.get(card.id) ?? null;
      const isNew = !state;
      const isDue = isNew || new Date(state!.due_at).getTime() <= now;
      return { ...card, deck: deckById.get(card.deck_id), state, isDue, isNew };
    });

  return withState;
}

export interface DeckStats {
  deck: Deck;
  total: number;
  learned: number;
}

/** Resumen por mazo de vocabulario: cuantas tarjetas tiene y cuantas ya
 * empezaste a repasar (para mostrar "aprendidas / total" en la lista). */
export async function getDeckStats(userId: string): Promise<DeckStats[]> {
  const supabase = getSupabaseBrowserClient();
  const [{ decks, cards }, { data: states, error }] = await Promise.all([
    getAllDecksWithCards(),
    supabase.from("srs_state").select("card_id").eq("user_id", userId),
  ]);
  if (error) throw error;

  const learnedCardIds = new Set((states ?? []).map((s) => s.card_id));
  const byDeck = new Map<string, { total: number; learned: number }>();
  for (const c of cards) {
    const entry = byDeck.get(c.deck_id) ?? { total: 0, learned: 0 };
    entry.total++;
    if (learnedCardIds.has(c.id)) entry.learned++;
    byDeck.set(c.deck_id, entry);
  }

  return decks
    .filter((d) => d.category === "vocab")
    .map((deck) => ({ deck, ...(byDeck.get(deck.id) ?? { total: 0, learned: 0 }) }));
}

export async function getCardsByDeckId(deckId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("deck_id", deckId)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

/** Cuenta tarjetas pendientes sin descargar el contenido: solo un conteo. */
export async function countDue(userId: string) {
  const supabase = getSupabaseBrowserClient();
  const { count, error } = await supabase
    .from("srs_state")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .lte("due_at", new Date().toISOString());
  if (error) throw error;
  return count ?? 0;
}

/** Tras ver las palabras de una lección, entran en el repaso espaciado
 * para que mañana toque recordarlas (sin pisar las que ya tenían estado). */
export async function seedCardsForReview(userId: string, cardIds: string[]) {
  if (cardIds.length === 0) return;
  const supabase = getSupabaseBrowserClient();
  const due = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from("srs_state").upsert(
    cardIds.map((card_id) => ({
      user_id: userId,
      card_id,
      ease_factor: 2.5,
      interval_days: 1,
      repetitions: 0,
      due_at: due,
    })),
    { onConflict: "user_id,card_id", ignoreDuplicates: true }
  );
  if (error) throw error;
}

export async function submitReview(
  userId: string,
  card: CardWithState,
  quality: ReviewQuality
) {
  const supabase = getSupabaseBrowserClient();
  const base = card.state
    ? {
        easeFactor: card.state.ease_factor,
        intervalDays: card.state.interval_days,
        repetitions: card.state.repetitions,
      }
    : createInitialSrsState();

  const result = reviewCard(base, quality);

  const { error } = await supabase.from("srs_state").upsert(
    {
      user_id: userId,
      card_id: card.id,
      ease_factor: result.easeFactor,
      interval_days: result.intervalDays,
      repetitions: result.repetitions,
      due_at: result.dueAt.toISOString(),
      last_reviewed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,card_id" }
  );
  if (error) throw error;
}
