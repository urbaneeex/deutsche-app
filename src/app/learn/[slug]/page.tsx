"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import RequireAuth from "@/components/RequireAuth";
import {
  getPathStepBySlug,
  getPathSteps,
  getCompletedStepIds,
  markStepComplete,
  isStepUnlocked,
  EXAM_PASS_SCORE,
} from "@/lib/data/path";
import { getCardsByDeckId, seedCardsForReview } from "@/lib/data/flashcards";
import { similarityScore, speakGerman } from "@/lib/speech";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { buildCardExercises, fromGrammar, type Exercise } from "@/lib/exercises";
import { addXp, XP_PER_CORRECT } from "@/lib/dailyGoal";
import { haptic } from "@/lib/feedback";
import SpeakButton from "@/components/SpeakButton";
import QuizRunner, { type QuizResult } from "@/components/QuizRunner";
import Confetti from "@/components/Confetti";
import { splitSentences } from "@/components/GermanText";
import SlideDeck from "@/components/SlideDeck";
import { SLIDES, type Slide } from "@/data/visual/slides";
import type { Card, PathStep } from "@/lib/types/database";

const articleClass: Record<string, string> = {
  der: "article-der",
  die: "article-die",
  das: "article-das",
};

type Phase = "intro" | "vocab" | "pronunciation" | "quiz" | "done";

const PHASE_LABEL: Record<Phase, string> = {
  intro: "Teoría",
  vocab: "Vocabulario",
  pronunciation: "Voz",
  quiz: "Práctica",
  done: "",
};

const PRIMARY_BTN =
  "w-full rounded-2xl bg-amber-500 py-3.5 text-base font-bold text-stone-950 transition active:scale-[0.98]";

function StepContent() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState<PathStep | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [nextSlug, setNextSlug] = useState<string | null>(null);
  const [phaseIndex, setPhaseIndex] = useState(0);

  const [vocabIndex, setVocabIndex] = useState(0);
  const [vocabFlipped, setVocabFlipped] = useState(false);

  const [pronIndex, setPronIndex] = useState(0);
  const { supported, listening, transcript, start, stop } = useSpeechRecognition();

  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [currentStep, allSteps] = await Promise.all([
        getPathStepBySlug(params.slug),
        getPathSteps(),
      ]);
      if (!active) return;
      setStep(currentStep);

      const levelSteps = allSteps.filter((s) => s.level === currentStep.level);
      const idx = levelSteps.findIndex((s) => s.id === currentStep.id);
      setNextSlug(levelSteps[idx + 1]?.slug ?? null);

      if (user) {
        const completedIds = await getCompletedStepIds(user.id);
        if (active) setAllowed(isStepUnlocked(levelSteps, idx, completedIds));
      }

      if (currentStep.deck_id) {
        const deckCards = await getCardsByDeckId(currentStep.deck_id);
        if (active) setCards(deckCards);
      }
    })();
    return () => {
      active = false;
    };
  }, [params.slug, user]);

  useEffect(() => {
    if (allowed === false) router.replace("/learn");
  }, [allowed, router]);

  const pronunciationPhrases = useMemo(
    () => cards.filter((c) => c.example_sentence).map((c) => c.example_sentence!),
    [cards]
  );

  const isExam = step?.step_type === "exam";

  const exercises: Exercise[] = useMemo(() => {
    void attempt; // cambiar el intento vuelve a barajar el examen
    if (!step) return [];
    const own = step.content.exercises.map(fromGrammar);
    return isExam ? own : [...own, ...buildCardExercises(cards, 6)];
  }, [step, cards, isExam, attempt]);

  const slides: Slide[] = useMemo(() => {
    if (!step) return [];
    if (SLIDES[step.slug]) return SLIDES[step.slug];
    // Sin tarjetas hechas a mano: una por sección, partida en frases cortas
    // y con las parejas «a -> b» convertidas en fichas.
    return step.content.sections.map((sec) => ({
      t: "points" as const,
      title: sec.heading,
      items: splitSentences(sec.body),
    }));
  }, [step]);

  const phases: Phase[] = useMemo(() => {
    if (!step) return [];
    const list: Phase[] = [];
    if (step.content.sections.length > 0) list.push("intro");
    if (cards.length > 0) list.push("vocab");
    if (pronunciationPhrases.length > 0) list.push("pronunciation");
    if (exercises.length > 0) list.push("quiz");
    list.push("done");
    return list;
  }, [step, cards, pronunciationPhrases, exercises]);

  if (allowed === false) {
    return <p className="text-stone-400">Este paso todavía no está desbloqueado...</p>;
  }

  if (!step || phases.length === 0) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-5 w-32 animate-pulse rounded bg-stone-800" />
        <div className="h-8 w-2/3 animate-pulse rounded bg-stone-800" />
        <div className="h-40 animate-pulse rounded-2xl bg-stone-900" />
      </div>
    );
  }

  const phase = phases[Math.min(phaseIndex, phases.length - 1)];
  const visiblePhases = phases.filter((p) => p !== "done");
  const quizScore = result ? result.correct / Math.max(result.total, 1) : 1;
  const examFailed = isExam && result !== null && quizScore < EXAM_PASS_SCORE;

  function goNext() {
    haptic("tap");
    window.scrollTo({ top: 0 });
    setPhaseIndex((i) => Math.min(i + 1, phases.length - 1));
  }

  function retryExam() {
    setResult(null);
    setAttempt((a) => a + 1);
  }

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-5 pb-28">
      <div className="flex items-center gap-3">
        <Link
          href="/learn"
          aria-label="Salir de la lección"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl text-stone-400 active:bg-stone-800"
        >
          ✕
        </Link>
        <div className="flex flex-1 gap-1.5">
          {visiblePhases.map((p, i) => (
            <div
              key={p}
              className={`h-2 flex-1 rounded-full transition-colors ${
                i < phaseIndex
                  ? "bg-amber-500"
                  : i === phaseIndex
                    ? "bg-amber-500/50"
                    : "bg-stone-800"
              }`}
            />
          ))}
        </div>
      </div>

      {phase !== "done" && phase !== "intro" && (
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-400">
            {step.level} · {PHASE_LABEL[phase]}
          </span>
          <h1 className="text-2xl font-bold">{step.title}</h1>
        </div>
      )}

      {phase === "intro" && <SlideDeck slides={slides} onDone={goNext} />}

      {phase === "vocab" && (
        <div className="space-y-4">
          <p className="text-center text-xs text-stone-500">
            Palabra {vocabIndex + 1} / {cards.length}
          </p>
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              haptic("tap");
              setVocabFlipped((f) => !f);
            }}
            onKeyDown={(e) => e.key === "Enter" && setVocabFlipped((f) => !f)}
            className="flex min-h-[260px] w-full cursor-pointer select-none flex-col items-center justify-center rounded-3xl border border-stone-800 bg-gradient-to-b from-stone-900 to-stone-900/40 p-8 text-center transition active:scale-[0.99]"
          >
            {!vocabFlipped ? (
              <>
                <p className="text-4xl font-bold">
                  {cards[vocabIndex].article && (
                    <span className={`${articleClass[cards[vocabIndex].article!]} mr-2`}>
                      {cards[vocabIndex].article}
                    </span>
                  )}
                  {cards[vocabIndex].word}
                </p>
                <p className="mt-4 text-xs uppercase tracking-wide text-stone-500">
                  Toca para ver la traducción
                </p>
              </>
            ) : (
              <>
                <p className="text-3xl font-semibold text-amber-300">
                  {cards[vocabIndex].translation}
                </p>
                {cards[vocabIndex].example_sentence && (
                  <div className="mt-5 space-y-1 text-base text-stone-300">
                    <p>{cards[vocabIndex].example_sentence}</p>
                    <p className="text-sm italic text-stone-500">
                      {cards[vocabIndex].example_translation}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex justify-center">
            <SpeakButton
              getText={() => {
                const card = cards[vocabIndex];
                return vocabFlipped
                  ? card.example_sentence || card.word
                  : card.article
                    ? `${card.article} ${card.word}`
                    : card.word;
              }}
              className="flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-6 py-3 text-sm font-semibold text-sky-300 transition active:scale-95"
            />
          </div>
          <button
            onClick={() => {
              if (vocabIndex + 1 < cards.length) {
                const nextCard = cards[vocabIndex + 1];
                // Audio automático de la siguiente palabra, dentro del tap.
                void speakGerman(
                  nextCard.article ? `${nextCard.article} ${nextCard.word}` : nextCard.word
                );
                haptic("tap");
                setVocabIndex((i) => i + 1);
                setVocabFlipped(false);
              } else {
                goNext();
              }
            }}
            className={PRIMARY_BTN}
          >
            {vocabIndex + 1 < cards.length ? "Siguiente palabra" : "Continuar"}
          </button>
        </div>
      )}

      {phase === "pronunciation" && (
        <div className="space-y-4">
          <p className="text-center text-xs text-stone-500">
            Frase {pronIndex + 1} / {pronunciationPhrases.length}
          </p>
          <div className="rounded-3xl border border-stone-800 bg-stone-900/50 p-6 text-center">
            <p className="mb-5 text-xl font-semibold leading-snug">
              {pronunciationPhrases[pronIndex]}
            </p>
            <div className="flex items-center justify-center gap-3">
              <SpeakButton
                getText={() => pronunciationPhrases[pronIndex]}
                label="Nativo"
                stopPropagation={false}
                className="flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-5 py-3 text-sm font-semibold text-sky-300 transition active:scale-95"
              />
              {supported && (
                <button
                  onClick={() => (listening ? stop() : start())}
                  className={`rounded-full px-5 py-3 text-sm font-semibold transition active:scale-95 ${
                    listening ? "animate-pulse bg-stone-700" : "bg-rose-600"
                  }`}
                >
                  {listening ? "⏹ Parar" : "🎙️ Repetir"}
                </button>
              )}
            </div>
            {transcript && (
              <div className="mt-5 rounded-2xl bg-stone-950 p-3 text-left">
                <p className="text-xs text-stone-500">Se reconoció:</p>
                <p className="text-sm">{transcript}</p>
                <p className="mt-1 text-sm font-semibold text-amber-400">
                  {similarityScore(pronunciationPhrases[pronIndex], transcript) > 0.75
                    ? "✅ ¡Bien dicho!"
                    : "🔁 Casi: escucha al nativo y repite"}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (pronIndex + 1 < pronunciationPhrases.length) {
                setPronIndex((i) => i + 1);
              } else {
                goNext();
              }
            }}
            className={PRIMARY_BTN}
          >
            {pronIndex + 1 < pronunciationPhrases.length ? "Siguiente frase" : "Continuar"}
          </button>
          <button
            onClick={goNext}
            className="w-full py-2 text-sm text-stone-500 active:text-stone-300"
          >
            Saltar práctica de voz
          </button>
        </div>
      )}

      {phase === "quiz" && !result && (
        <>
          {isExam && (
            <p className="text-xs text-stone-500">
              Examen: necesitas al menos el {Math.round(EXAM_PASS_SCORE * 100)}% de
              aciertos a la primera para desbloquear el siguiente paso.
            </p>
          )}
          <QuizRunner key={attempt} exercises={exercises} onFinish={setResult} />
        </>
      )}

      {phase === "quiz" && result && (
        <div className="space-y-4 rounded-3xl border border-stone-800 bg-stone-900/50 p-6 text-center">
          <p className="text-5xl">{examFailed ? "😕" : "💪"}</p>
          <p className="text-lg font-bold">
            {result.correct} / {result.total} a la primera
          </p>
          {examFailed ? (
            <>
              <p className="text-sm text-rose-300">
                No aprobado: necesitas al menos {Math.round(EXAM_PASS_SCORE * 100)}%. Repasa
                la teoría e inténtalo de nuevo.
              </p>
              <button onClick={retryExam} className={PRIMARY_BTN}>
                🔁 Reintentar examen
              </button>
            </>
          ) : (
            <button onClick={goNext} className={PRIMARY_BTN}>
              Continuar
            </button>
          )}
        </div>
      )}

      {phase === "done" && (
        <StepDone
          step={step}
          cards={cards}
          result={result}
          score={quizScore}
          nextSlug={nextSlug}
          isExam={!!isExam}
        />
      )}
    </div>
  );
}

function StepDone({
  step,
  cards,
  result,
  score,
  nextSlug,
  isExam,
}: {
  step: PathStep;
  cards: Card[];
  result: QuizResult | null;
  score: number;
  nextSlug: string | null;
  isExam: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const triggeredRef = useRef(false);
  const xp = (result?.correct ?? 0) * XP_PER_CORRECT + 10;

  useEffect(() => {
    if (!user || triggeredRef.current) return;
    triggeredRef.current = true;
    haptic("ok");
    addXp(user.id, xp);
    (async () => {
      try {
        await markStepComplete(user.id, step.id, score);
        await seedCardsForReview(
          user.id,
          cards.map((c) => c.id)
        ).catch(() => {});
      } catch {
        setError("No se pudo guardar el progreso. Revisa tu conexión e inténtalo otra vez.");
      } finally {
        setSaving(false);
      }
    })();
  }, [user, step.id, score, xp, cards]);

  return (
    <div className="space-y-5 rounded-3xl border border-emerald-800/40 bg-gradient-to-b from-emerald-950/40 to-emerald-950/10 p-8 text-center">
      <Confetti />
      <p className="animate-pop text-7xl">🎉</p>
      <h2 className="text-2xl font-bold">{isExam ? "¡Examen aprobado!" : "¡Paso completado!"}</h2>
      <div className="flex justify-center gap-3 text-sm">
        <span className="rounded-full bg-amber-500/15 px-4 py-1.5 font-semibold text-amber-300">
          +{xp} XP
        </span>
        {result && (
          <span className="rounded-full bg-emerald-500/15 px-4 py-1.5 font-semibold text-emerald-300">
            {Math.round(score * 100)}% a la primera
          </span>
        )}
      </div>
      {cards.length > 0 && (
        <p className="text-sm text-stone-400">
          {cards.length} palabras añadidas a tu repaso de mañana.
        </p>
      )}
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <div className="space-y-2">
        {nextSlug && (
          <Link
            href={`/learn/${nextSlug}`}
            aria-disabled={saving}
            className={`block ${PRIMARY_BTN} ${saving ? "pointer-events-none opacity-50" : ""}`}
          >
            {saving ? "Guardando..." : "Siguiente paso →"}
          </Link>
        )}
        <button
          onClick={() => router.push("/learn")}
          disabled={saving}
          className="w-full rounded-2xl bg-stone-800 py-3.5 text-base font-semibold transition active:scale-[0.98] disabled:opacity-50"
        >
          Volver a la ruta
        </button>
      </div>
    </div>
  );
}

export default function LearnStepPage() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <RequireAuth>
      <StepContent key={slug} />
    </RequireAuth>
  );
}
