"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import RequireAuth from "@/components/RequireAuth";
import SpeakButton from "@/components/SpeakButton";
import { getReviewQueue, submitReview, type CardWithState } from "@/lib/data/flashcards";
import { REVIEW_BUTTONS, type ReviewQuality } from "@/lib/srs";
import { addXp } from "@/lib/dailyGoal";
import { haptic } from "@/lib/feedback";
import { speakGerman } from "@/lib/speech";

const SESSION_SIZE = 15;
const NEW_PER_SESSION = 5;

const articleClass: Record<string, string> = {
  der: "article-der",
  die: "article-die",
  das: "article-das",
};

const BUTTON_STYLE: Record<number, string> = {
  0: "bg-rose-950/70 text-rose-300 border-rose-800/60",
  3: "bg-stone-800 text-stone-200 border-stone-700",
  4: "bg-emerald-950/70 text-emerald-300 border-emerald-800/60",
  5: "bg-sky-950/70 text-sky-300 border-sky-800/60",
};

function PracticeContent() {
  const { user } = useAuth();
  const [queue, setQueue] = useState<CardWithState[] | null>(null);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getReviewQueue(user.id, SESSION_SIZE, NEW_PER_SESSION)
      .then(setQueue)
      .catch(() => setError("No se pudo cargar tu repaso."));
  }, [user]);

  if (error) return <p className="text-rose-400">{error}</p>;
  if (!queue) {
    return <div className="h-72 animate-pulse rounded-3xl bg-stone-900" aria-busy="true" />;
  }

  const card = queue[pos];

  if (!card) {
    return (
      <div className="animate-fade-in space-y-4 rounded-3xl border border-emerald-800/40 bg-emerald-950/20 p-8 text-center">
        <p className="text-6xl">{reviewed > 0 ? "🏆" : "✅"}</p>
        <h1 className="text-2xl font-bold">
          {reviewed > 0 ? `¡${reviewed} tarjetas repasadas!` : "Hoy no tienes nada pendiente"}
        </h1>
        <p className="text-sm text-stone-400">
          {reviewed > 0
            ? "Repasar poco cada día es lo que hace que se quede. Vuelve mañana."
            : "Avanza en la ruta para desbloquear más vocabulario."}
        </p>
        <Link
          href="/learn"
          className="block rounded-2xl bg-amber-500 py-3.5 font-bold text-stone-950 active:scale-[0.98]"
        >
          Volver a Aprender
        </Link>
      </div>
    );
  }

  const front = card.article ? `${card.article} ${card.word}` : card.word;

  async function rate(quality: ReviewQuality) {
    if (!user) return;
    haptic(quality === 0 ? "bad" : "ok");
    const current = card;
    // Optimista: pasamos a la siguiente sin esperar a la red.
    submitReview(user.id, current, quality).catch(() => {});
    addXp(user.id, quality === 0 ? 1 : 2);
    setReviewed((n) => n + 1);
    setFlipped(false);
    if (quality === 0) setQueue((q) => (q ? [...q, current] : q));
    setPos((p) => p + 1);
    const upcoming = queue![pos + 1];
    if (upcoming) {
      void speakGerman(
        upcoming.article ? `${upcoming.article} ${upcoming.word}` : upcoming.word
      );
    }
  }

  return (
    <div className="animate-fade-in mx-auto max-w-md space-y-4 pb-32">
      <div className="flex items-center gap-3">
        <Link
          href="/learn"
          aria-label="Salir"
          className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-stone-400 active:bg-stone-800"
        >
          ✕
        </Link>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-800">
          <div
            className="h-full rounded-full bg-sky-500 transition-all"
            style={{ width: `${(pos / queue.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-stone-500">
          {pos + 1}/{queue.length}
        </span>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          haptic("tap");
          setFlipped((f) => !f);
        }}
        onKeyDown={(e) => e.key === "Enter" && setFlipped((f) => !f)}
        className="flex min-h-[300px] cursor-pointer select-none flex-col items-center justify-center rounded-3xl border border-stone-800 bg-gradient-to-b from-stone-900 to-stone-900/40 p-8 text-center transition active:scale-[0.99]"
      >
        {card.isNew && (
          <span className="mb-3 rounded-full bg-violet-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-violet-300">
            Nueva
          </span>
        )}
        {!flipped ? (
          <>
            <p className="text-4xl font-bold">
              {card.article && (
                <span className={`${articleClass[card.article]} mr-2`}>{card.article}</span>
              )}
              {card.word}
            </p>
            <p className="mt-4 text-xs uppercase tracking-wide text-stone-500">
              ¿Lo recuerdas? Toca para comprobar
            </p>
          </>
        ) : (
          <>
            <p className="text-3xl font-semibold text-amber-300">{card.translation}</p>
            {card.example_sentence && (
              <div className="mt-5 space-y-1">
                <p className="text-base text-stone-300">{card.example_sentence}</p>
                <p className="text-sm italic text-stone-500">{card.example_translation}</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex justify-center">
        <SpeakButton
          getText={() => (flipped ? card.example_sentence || front : front)}
          className="flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-6 py-3 text-sm font-semibold text-sky-300 transition active:scale-95"
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-800 bg-stone-950 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-md">
          {flipped ? (
            <div className="grid grid-cols-4 gap-2">
              {REVIEW_BUTTONS.map((btn) => (
                <button
                  key={btn.quality}
                  onClick={() => rate(btn.quality)}
                  className={`rounded-2xl border py-3.5 text-sm font-semibold transition active:scale-95 ${BUTTON_STYLE[btn.quality]}`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={() => setFlipped(true)}
              className="w-full rounded-2xl bg-amber-500 py-3.5 text-base font-bold text-stone-950 active:scale-[0.98]"
            >
              Mostrar respuesta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PracticePage() {
  return (
    <RequireAuth>
      <PracticeContent />
    </RequireAuth>
  );
}
