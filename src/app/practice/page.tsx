"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import RequireAuth from "@/components/RequireAuth";
import QuizRunner, { type QuizResult } from "@/components/QuizRunner";
import Confetti from "@/components/Confetti";
import { getReviewSession, submitReview } from "@/lib/data/flashcards";
import { exerciseForCard, type Exercise } from "@/lib/exercises";
import { addXp } from "@/lib/dailyGoal";
import type { Card, SrsState } from "@/lib/types/database";

const SESSION_SIZE = 12;
const NEW_PER_SESSION = 4;

type Prepared = { exercises: Exercise[]; cards: Map<string, { card: Card; state: SrsState | null }> };

/**
 * Repaso diario autocorregido: la app te pregunta y decide ella si lo
 * sabes (acierto a la primera = "bien", fallo = vuelve en 10 min). Ya no
 * te toca puntuarte a ti mismo.
 */
function PracticeContent() {
  const { user } = useAuth();
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const answeredRef = useRef(new Set<string>());

  useEffect(() => {
    if (!user) return;
    getReviewSession(user.id, SESSION_SIZE, NEW_PER_SESSION)
      .then(({ queue, pool }) => {
        const cards = new Map(queue.map((c) => [c.id, { card: c as Card, state: c.state }]));
        const exercises = queue.map((c, i) =>
          // Las que ya dominas se escriben; las nuevas se reconocen.
          exerciseForCard(c, pool, (c.state?.repetitions ?? 0) >= 2 ? 3 : i % 2)
        );
        setPrepared({ exercises, cards });
      })
      .catch(() => setError("No se pudo cargar tu repaso."));
  }, [user]);

  if (error) return <p className="text-rose-400">{error}</p>;
  if (!prepared) {
    return <div className="h-72 animate-pulse rounded-3xl bg-stone-900" aria-busy="true" />;
  }

  if (prepared.exercises.length === 0 || result) {
    const done = result?.total ?? 0;
    return (
      <div className="animate-fade-in space-y-4 rounded-3xl border border-emerald-800/40 bg-emerald-950/20 p-8 text-center">
        {done > 0 && <Confetti />}
        <p className="animate-pop text-6xl">{done > 0 ? "🏆" : "✅"}</p>
        <h1 className="text-2xl font-bold">
          {done > 0 ? `¡${result!.correct} de ${done} a la primera!` : "Hoy no tienes nada pendiente"}
        </h1>
        <p className="text-sm text-stone-400">
          {done > 0
            ? "Las que has fallado volverán pronto. Repasar poco cada día es lo que hace que se quede."
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

  function handleAnswer(ex: Exercise, ok: boolean, firstTry: boolean) {
    if (!user || !ex.ref || !firstTry || answeredRef.current.has(ex.ref)) return;
    answeredRef.current.add(ex.ref);
    const entry = prepared!.cards.get(ex.ref);
    if (!entry) return;
    addXp(user.id, ok ? 3 : 1);
    submitReview(user.id, { ...entry.card, state: entry.state, isDue: true, isNew: !entry.state }, ok ? 4 : 0).catch(
      () => {}
    );
  }

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-4 pb-28">
      <div className="flex items-center gap-3">
        <Link
          href="/learn"
          aria-label="Salir"
          className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-stone-400 active:bg-stone-800"
        >
          ✕
        </Link>
        <h1 className="font-bold">🧠 Repaso del día</h1>
      </div>
      <QuizRunner exercises={prepared.exercises} onFinish={setResult} onAnswer={handleAnswer} />
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
