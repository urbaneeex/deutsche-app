"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import RequireAuth from "@/components/RequireAuth";
import {
  getDeckStats,
  getDeckQueue,
  submitReview,
  type CardWithState,
  type DeckStats,
} from "@/lib/data/flashcards";
import { REVIEW_BUTTONS } from "@/lib/srs";
import SpeakButton from "@/components/SpeakButton";
import type { Deck } from "@/lib/types/database";
import {
  IconDotsVertical,
  IconEdit,
  IconSparkles,
  IconTrash,
} from "@/components/icons";

const articleClass: Record<string, string> = {
  der: "article-der",
  die: "article-die",
  das: "article-das",
};

const ALL_KEY = "all"; // legado en localStorage

function pickDeckId(stats: DeckStats[], preferred: string | null): string | null {
  if (preferred && stats.some((s) => s.deck.id === preferred)) return preferred;
  return stats[0]?.deck.id ?? null;
}

const TOPIC_ORDER = [
  "Gramática",
  "Números y tiempo",
  "Casa y familia",
  "Comida y compras",
  "Salud",
  "Ciudad y viajes",
  "Trabajo y trámites",
  "Ocio y cultura",
  "Sociedad y actualidad",
  "Generadas por IA",
];
const OTHER_TOPIC = "Otros";

function groupDecksByTopic(decks: DeckStats[]): { topic: string; decks: DeckStats[] }[] {
  const byTopic = new Map<string, DeckStats[]>();
  for (const stat of decks) {
    const topic = stat.deck.topic ?? OTHER_TOPIC;
    const list = byTopic.get(topic) ?? [];
    list.push(stat);
    byTopic.set(topic, list);
  }

  const order = [...TOPIC_ORDER, OTHER_TOPIC];
  return order
    .filter((topic) => byTopic.has(topic))
    .map((topic) => ({ topic, decks: byTopic.get(topic)! }));
}

function lastCardKey(userId: string, categoryKey: string) {
  return `flashcards:lastCardId:${userId}:${categoryKey}`;
}

function lastCategoryKey(userId: string) {
  return `flashcards:lastCategory:${userId}`;
}

function DotsIcon() {
  return <IconDotsVertical />;
}

function MenuItem({
  icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition disabled:opacity-50 ${
        danger
          ? "text-rose-400 hover:bg-rose-950/40"
          : "text-stone-300 hover:bg-stone-800"
      }`}
    >
      <span className={danger ? "text-rose-400/80" : "text-stone-500"}>{icon}</span>
      {label}
    </button>
  );
}

function DeckMenu({
  deck,
  active,
  onUpdated,
  onDeleted,
}: {
  deck: Deck;
  active?: boolean;
  onUpdated: () => void;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(deck.title);
  const [busy, setBusy] = useState<"expand" | "delete" | "edit" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExpand() {
    setBusy("expand");
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "flashcards-expand", deckId: deck.id }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "No se pudieron añadir tarjetas.");
      setOpen(false);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setBusy(null);
    }
  }

  async function handleSaveTitle() {
    const trimmed = title.trim();
    if (!trimmed) return;
    setBusy("edit");
    setError(null);
    try {
      const res = await fetch(`/api/decks/${deck.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "No se pudo guardar el título.");
      setEditing(false);
      setOpen(false);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar el mazo "${deck.title}" y todas sus tarjetas?`)) return;
    setBusy("delete");
    setError(null);
    try {
      const res = await fetch(`/api/decks/${deck.id}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "No se pudo eliminar el mazo.");
      setOpen(false);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="absolute right-1.5 top-1/2 z-10 -translate-y-1/2">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
          setError(null);
        }}
        aria-label="Opciones del mazo"
        aria-expanded={open}
        className={`flex h-7 w-7 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-800/80 hover:text-stone-300 ${
          open || active ? "opacity-100" : "opacity-0 group-hover/row:opacity-100"
        }`}
      >
        <DotsIcon />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Cerrar menú"
            className="fixed inset-0 z-40"
            onClick={() => {
              setOpen(false);
              setEditing(false);
            }}
          />
          <div className="absolute right-0 top-full z-50 mt-0.5 w-44 rounded-xl border border-stone-700 bg-stone-900 py-1 shadow-xl">
            {editing ? (
              <div className="space-y-2 px-3 py-2">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-stone-700 bg-stone-950 px-2 py-1.5 text-sm outline-none focus:border-amber-500"
                  autoFocus
                />
                <div className="flex gap-1.5">
                  <button
                    onClick={handleSaveTitle}
                    disabled={busy === "edit" || !title.trim()}
                    className="flex-1 rounded-lg bg-amber-500 px-2 py-1 text-xs font-semibold text-stone-950 disabled:opacity-50"
                  >
                    {busy === "edit" ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="rounded-lg border border-stone-700 px-2 py-1 text-xs text-stone-400"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <MenuItem
                  icon={<IconEdit size={15} />}
                  label="Editar título"
                  onClick={() => {
                    setTitle(deck.title);
                    setEditing(true);
                  }}
                />
                <MenuItem
                  icon={<IconSparkles size={15} />}
                  label={busy === "expand" ? "Generando..." : "Ampliar con IA"}
                  onClick={handleExpand}
                  disabled={busy === "expand"}
                />
                <MenuItem
                  icon={<IconTrash size={15} />}
                  label={busy === "delete" ? "Eliminando..." : "Eliminar mazo"}
                  onClick={handleDelete}
                  disabled={busy === "delete"}
                  danger
                />
              </>
            )}
            {error && <p className="px-3 py-1 text-xs text-rose-400">{error}</p>}
          </div>
        </>
      )}
    </div>
  );
}

function DeckHeader({
  deck,
  cardIndex,
  cardTotal,
  onUpdated,
  onDeleted,
}: {
  deck: Deck | undefined;
  cardIndex?: number;
  cardTotal?: number;
  onUpdated: () => void;
  onDeleted: (deckId: string) => void;
}) {
  if (!deck) {
    if (cardIndex == null || cardTotal == null) return null;
    return (
      <p className="mb-4 text-center text-xs text-stone-500">
        Tarjeta {cardIndex} / {cardTotal}
      </p>
    );
  }

  return (
    <div className="group/row relative mb-4 rounded-xl border border-stone-800 bg-stone-900/40 px-3 py-2.5">
      <div className="min-w-0 pr-8">
        <p className="truncate text-sm font-medium text-stone-200">{deck.title}</p>
        {cardIndex != null && cardTotal != null && (
          <p className="text-xs text-stone-500">
            Tarjeta {cardIndex} / {cardTotal}
          </p>
        )}
      </div>
      <DeckMenu
        key={`${deck.id}-${deck.title}`}
        deck={deck}
        active
        onUpdated={onUpdated}
        onDeleted={() => onDeleted(deck.id)}
      />
    </div>
  );
}

function CategorySidebar({
  decks,
  selectedDeckId,
  onSelect,
  onDeckUpdated,
  onDeckDeleted,
  generating,
  topic,
  setTopic,
  onGenerate,
  genError,
}: {
  decks: DeckStats[] | null;
  selectedDeckId: string | null;
  onSelect: (id: string) => void;
  onDeckUpdated: () => void;
  onDeckDeleted: (deckId: string) => void;
  generating: boolean;
  topic: string;
  setTopic: (v: string) => void;
  onGenerate: () => void;
  genError: string | null;
}) {
  const groups = decks ? groupDecksByTopic(decks) : [];

  return (
    <aside className="order-2 w-full shrink-0 space-y-4 sm:order-1 sm:w-64">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
          Categorías
        </p>
        <div className="space-y-1.5">
          {groups.map(({ topic, decks: topicDecks }) => {
            const hasSelected = topicDecks.some(({ deck }) => deck.id === selectedDeckId);
            return (
              <details key={topic} className="group" open={hasSelected || undefined}>
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-1 py-1.5 text-xs font-semibold text-stone-400 hover:text-stone-200">
                  <span>{topic}</span>
                  <span className="text-stone-600 transition group-open:rotate-90">›</span>
                </summary>
                <div className="mt-1 space-y-1.5 pl-0.5">
                  {topicDecks.map(({ deck, total, learned }) => (
                    <div
                      key={deck.id}
                      className={`group/row relative rounded-xl border transition ${
                        selectedDeckId === deck.id
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-stone-800 bg-stone-900/40 hover:border-stone-600"
                      }`}
                    >
                      <button
                        onClick={() => onSelect(deck.id)}
                        className={`flex w-full items-center justify-between gap-2 px-3 py-2 pr-9 text-left text-sm ${
                          selectedDeckId === deck.id ? "text-amber-300" : "text-stone-300"
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-1.5 truncate">
                          <span className="truncate">{deck.title}</span>
                          {deck.source === "ai" && (
                            <span className="shrink-0 rounded-full border border-violet-800/60 bg-violet-950/30 px-1.5 py-0.5 text-[9px] text-violet-300">
                              IA
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-xs text-stone-500">
                          {learned}/{total}
                        </span>
                      </button>
                      <DeckMenu
                        key={`${deck.id}-${deck.title}`}
                        deck={deck}
                        active={selectedDeckId === deck.id}
                        onUpdated={onDeckUpdated}
                        onDeleted={() => onDeckDeleted(deck.id)}
                      />
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-stone-700 p-3">
        <p className="mb-2 text-xs text-stone-400">
          ¿Necesitas vocabulario de algo concreto? Pide tarjetas nuevas.
        </p>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Ej. ropa, el trabajo, el médico..."
          className="mb-2 w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-1.5 text-sm outline-none focus:border-amber-500"
        />
        <div className="flex">
          <button
            onClick={onGenerate}
            disabled={generating || !topic.trim()}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold hover:bg-violet-500 disabled:opacity-50"
          >
            <IconSparkles size={14} />
            {generating ? "Generando..." : "Generar"}
          </button>
        </div>
        {genError && <p className="mt-2 text-xs text-rose-400">{genError}</p>}
      </div>
    </aside>
  );
}

function FlashcardsContent() {
  const { user } = useAuth();
  const [decks, setDecks] = useState<DeckStats[] | null>(null);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [queue, setQueue] = useState<CardWithState[] | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionDone, setSessionDone] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [topic, setTopic] = useState("");

  const categoryKey = selectedDeckId ?? "";

  const loadDecks = useCallback(async (opts?: { preferStored?: boolean }) => {
    if (!user) return;
    const stats = await getDeckStats(user.id);
    setDecks(stats);
    setSelectedDeckId((current) => {
      let preferred = current;
      if (opts?.preferStored) {
        const stored = localStorage.getItem(lastCategoryKey(user.id));
        preferred = stored && stored !== ALL_KEY ? stored : current;
      }
      const nextId = pickDeckId(stats, preferred);
      if (nextId) localStorage.setItem(lastCategoryKey(user.id), nextId);
      return nextId;
    });
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de mazos
    void loadDecks({ preferStored: true });
  }, [loadDecks]);

  const loadQueue = useCallback(() => {
    if (!user || !selectedDeckId) {
      setQueue([]);
      return;
    }
    getDeckQueue(user.id, selectedDeckId).then((q) => {
      setQueue(q);
      setFlipped(false);
      setSessionDone(0);
      const lastCardId = localStorage.getItem(lastCardKey(user.id, categoryKey));
      const resumeIndex = lastCardId
        ? q.findIndex((c) => c.id === lastCardId)
        : -1;
      setIndex(resumeIndex >= 0 ? resumeIndex : 0);
    });
  }, [user, selectedDeckId, categoryKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- recargar cola al cambiar mazo
    loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    if (!user || !queue || !selectedDeckId || index >= queue.length) return;
    localStorage.setItem(lastCardKey(user.id, categoryKey), queue[index].id);
  }, [user, queue, index, categoryKey, selectedDeckId]);

  function selectCategory(deckId: string) {
    if (!user) return;
    setSelectedDeckId(deckId);
    localStorage.setItem(lastCategoryKey(user.id), deckId);
  }

  async function handleDeckDeleted(deckId: string) {
    if (!user) return;
    const stats = await getDeckStats(user.id);
    setDecks(stats);
    if (selectedDeckId === deckId) {
      const nextId = pickDeckId(
        stats.filter((s) => s.deck.id !== deckId),
        null
      );
      setSelectedDeckId(nextId);
      if (nextId) localStorage.setItem(lastCategoryKey(user.id), nextId);
      else localStorage.removeItem(lastCategoryKey(user.id));
    }
  }

  function handleDeckUpdated() {
    loadDecks();
    loadQueue();
  }

  const selectedDeck = decks?.find((d) => d.deck.id === selectedDeckId)?.deck;

  async function handleGenerate() {
    if (!user || !topic.trim()) return;
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "flashcards", topic }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "No se pudieron generar las tarjetas.");
      setTopic("");
      loadDecks();
      selectCategory(body.deck.id);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setGenerating(false);
    }
  }

  const sidebarProps = {
    decks,
    selectedDeckId,
    onSelect: selectCategory,
    onDeckUpdated: handleDeckUpdated,
    onDeckDeleted: handleDeckDeleted,
    generating,
    topic,
    setTopic,
    onGenerate: handleGenerate,
    genError,
  };

  if (!decks || !selectedDeckId) {
    return (
      <div className="animate-fade-in flex flex-col gap-6 sm:flex-row">
        <p className="order-1 text-stone-400 sm:order-2">
          {!decks ? "Cargando mazos..." : "No hay mazos. Genera uno con IA."}
        </p>
        <CategorySidebar {...sidebarProps} />
      </div>
    );
  }

  if (!queue) {
    return (
      <div className="animate-fade-in flex flex-col gap-6 sm:flex-row">
        <p className="order-1 text-stone-400 sm:order-2">Cargando tarjetas...</p>
        <CategorySidebar {...sidebarProps} />
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="animate-fade-in flex flex-col gap-6 sm:flex-row">
        <div className="order-1 mx-auto w-full max-w-md flex-1 sm:order-2">
          <DeckHeader
            deck={selectedDeck}
            onUpdated={handleDeckUpdated}
            onDeleted={handleDeckDeleted}
          />
          <div className="rounded-2xl border border-stone-800 bg-stone-900/50 p-8 text-center">
          <p className="mb-1 text-4xl">🎉</p>
          <h2 className="text-lg font-semibold">Este mazo está vacío.</h2>
          <p className="text-sm text-stone-400">
            Vuelve más tarde o pide tarjetas nuevas de un tema que te interese.
          </p>
          </div>
        </div>
        <CategorySidebar {...sidebarProps} />
      </div>
    );
  }

  if (index >= queue.length) {
    return (
      <div className="animate-fade-in flex flex-col gap-6 sm:flex-row">
        <div className="order-1 flex-1 rounded-2xl border border-stone-800 bg-stone-900/50 p-8 text-center sm:order-2">
          <p className="mb-1 text-4xl">✅</p>
          <h2 className="text-lg font-semibold">
            Sesión terminada: {sessionDone} tarjetas repasadas
          </h2>
          <button
            onClick={loadQueue}
            className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-stone-950 hover:bg-amber-400"
          >
            Repasar más
          </button>
        </div>
        <CategorySidebar {...sidebarProps} />
      </div>
    );
  }

  const card = queue[index];
  const total = queue.length;

  async function handleReview(quality: 0 | 3 | 4 | 5) {
    if (!user) return;
    await submitReview(user.id, card, quality);
    setSessionDone((n) => n + 1);
    setFlipped(false);
    setIndex((i) => i + 1);
    loadDecks();
  }

  function handlePrev() {
    setFlipped(false);
    setIndex((i) => Math.max(0, i - 1));
  }

  function handleNext() {
    setFlipped(false);
    setIndex((i) => Math.min(total, i + 1));
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6 sm:flex-row">
      <div className="order-1 mx-auto w-full max-w-md flex-1 sm:order-2">
        <DeckHeader
          deck={selectedDeck}
          cardIndex={index + 1}
          cardTotal={total}
          onUpdated={handleDeckUpdated}
          onDeleted={handleDeckDeleted}
        />

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handlePrev}
            disabled={index === 0}
            aria-label="Tarjeta anterior"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-700 text-lg text-stone-300 transition hover:border-amber-500 hover:text-amber-300 disabled:opacity-30 disabled:hover:border-stone-700 disabled:hover:text-stone-300"
          >
            ‹
          </button>

          <div className="min-w-0 flex-1">
            <button
              onClick={() => setFlipped((f) => !f)}
              className="flex min-h-[260px] w-full flex-col items-center justify-center rounded-3xl border border-stone-800 bg-stone-900/60 p-8 text-center transition hover:border-amber-500/40"
            >
              {!flipped ? (
                <>
                  <p className="text-3xl font-bold">
                    {card.article && (
                      <span className={`${articleClass[card.article]} mr-2`}>
                        {card.article}
                      </span>
                    )}
                    {card.word}
                  </p>
                  {card.gender && (
                    <p className="mt-1 text-xs text-stone-500">{card.gender}</p>
                  )}
                  <p className="mt-3 text-xs uppercase tracking-wide text-stone-500">
                    Toca para ver la traducción
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-semibold text-amber-300">
                    {card.translation}
                  </p>
                  {card.example_sentence && (
                    <div className="mt-4 space-y-1 text-sm text-stone-400">
                      <p>{card.example_sentence}</p>
                      <p className="italic">{card.example_translation}</p>
                    </div>
                  )}
                  {card.tags && card.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                      {card.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-stone-700 px-2 py-0.5 text-[10px] text-stone-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </button>

            <div className="mt-3">
              <SpeakButton
                getText={() =>
                  flipped
                    ? card.example_sentence || card.word
                    : card.article
                      ? `${card.article} ${card.word}`
                      : card.word
                }
              />
            </div>
          </div>

          <button
            onClick={handleNext}
            aria-label="Tarjeta siguiente"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-700 text-lg text-stone-300 transition hover:border-amber-500 hover:text-amber-300"
          >
            ›
          </button>
        </div>

        {flipped && (
          <div className="mt-6 grid grid-cols-4 gap-2">
            {REVIEW_BUTTONS.map((btn) => (
              <button
                key={btn.quality}
                onClick={() => handleReview(btn.quality)}
                className={`rounded-lg py-2.5 text-xs font-medium transition ${
                  btn.quality === 0
                    ? "bg-rose-950/60 text-rose-300 hover:bg-rose-900"
                    : btn.quality === 3
                      ? "bg-stone-800 text-stone-300 hover:bg-stone-700"
                      : btn.quality === 4
                        ? "bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900"
                        : "bg-amber-950/60 text-amber-300 hover:bg-amber-900"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <CategorySidebar {...sidebarProps} />
    </div>
  );
}

export default function FlashcardsPage() {
  return (
    <RequireAuth>
      <FlashcardsContent />
    </RequireAuth>
  );
}
