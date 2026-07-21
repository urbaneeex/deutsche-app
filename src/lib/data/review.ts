import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getGrammarLessons, getLessonProgressMap } from "@/lib/data/lessons";
import { getAllDecksWithCards } from "@/lib/data/flashcards";
import {
  classifyGrammarMastery,
  classifyVocabMastery,
  countByMastery,
  type MasteryLevel,
} from "@/lib/mastery";
import type {
  Card,
  Deck,
  GrammarLesson,
  LessonProgress,
  SrsState,
} from "@/lib/types/database";

export interface GrammarLessonStats {
  lesson: GrammarLesson;
  progress: LessonProgress | null;
  mastery: MasteryLevel;
}

export interface GrammarCategoryStats {
  topic: string;
  lessons: GrammarLessonStats[];
}

export interface GrammarReview {
  categories: GrammarCategoryStats[];
  totalLessons: number;
  masteryCounts: Record<MasteryLevel, number>;
}

export async function getGrammarReview(userId: string): Promise<GrammarReview> {
  const [lessons, progressMap] = await Promise.all([
    getGrammarLessons(),
    getLessonProgressMap(userId),
  ]);

  const stats: GrammarLessonStats[] = lessons.map((lesson) => {
    const progress = progressMap.get(lesson.id) ?? null;
    return { lesson, progress, mastery: classifyGrammarMastery(progress) };
  });

  const byTopic = new Map<string, GrammarLessonStats[]>();
  for (const s of stats) {
    const list = byTopic.get(s.lesson.topic) ?? [];
    list.push(s);
    byTopic.set(s.lesson.topic, list);
  }

  const categories: GrammarCategoryStats[] = Array.from(byTopic.entries()).map(
    ([topic, items]) => ({ topic, lessons: items })
  );

  return {
    categories,
    totalLessons: lessons.length,
    masteryCounts: countByMastery(stats.map((s) => s.mastery)),
  };
}

export interface VocabCardStats {
  card: Card;
  state: SrsState | null;
  mastery: MasteryLevel;
}

export interface VocabCategoryStats {
  deck: Deck;
  cards: VocabCardStats[];
}

export interface VocabReview {
  categories: VocabCategoryStats[];
  totalCards: number;
  masteryCounts: Record<MasteryLevel, number>;
}

export async function getVocabReview(userId: string): Promise<VocabReview> {
  const supabase = getSupabaseBrowserClient();
  const [{ decks, cards }, { data: states, error }] = await Promise.all([
    getAllDecksWithCards(),
    supabase.from("srs_state").select("*").eq("user_id", userId),
  ]);
  if (error) throw error;

  const stateByCard = new Map((states ?? []).map((s) => [s.card_id, s]));
  const cardsByDeck = new Map<string, VocabCardStats[]>();

  for (const card of cards) {
    const state = stateByCard.get(card.id) ?? null;
    const list = cardsByDeck.get(card.deck_id) ?? [];
    list.push({ card, state, mastery: classifyVocabMastery(state) });
    cardsByDeck.set(card.deck_id, list);
  }

  const categories: VocabCategoryStats[] = decks
    .map((deck) => ({ deck, cards: cardsByDeck.get(deck.id) ?? [] }))
    .filter((c) => c.cards.length > 0);

  const allMastery = categories.flatMap((c) => c.cards.map((cd) => cd.mastery));

  return {
    categories,
    totalCards: cards.length,
    masteryCounts: countByMastery(allMastery),
  };
}
