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
import { getCardsByDeckId } from "@/lib/data/flashcards";
import { similarityScore } from "@/lib/speech";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import SpeakButton from "@/components/SpeakButton";
import type { Card, PathStep } from "@/lib/types/database";

const articleClass: Record<string, string> = {
  der: "article-der",
  die: "article-die",
  das: "article-das",
};

type Phase = "intro" | "vocab" | "pronunciation" | "quiz" | "done";

function StepContent() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState<PathStep | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [phaseIndex, setPhaseIndex] = useState(0);

  const [vocabIndex, setVocabIndex] = useState(0);
  const [vocabFlipped, setVocabFlipped] = useState(false);

  const [pronIndex, setPronIndex] = useState(0);
  const { supported, listening, transcript, start, stop } = useSpeechRecognition();

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizChecked, setQuizChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const [currentStep, allSteps] = await Promise.all([
        getPathStepBySlug(params.slug),
        getPathSteps(),
      ]);
      if (!active) return;
      setStep(currentStep);

      if (user) {
        const completedIds = await getCompletedStepIds(user.id);
        const levelSteps = allSteps.filter((s) => s.level === currentStep.level);
        const idx = levelSteps.findIndex((s) => s.id === currentStep.id);
        setAllowed(isStepUnlocked(levelSteps, idx, completedIds));
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

  const pronunciationPhrases = useMemo(
    () => cards.filter((c) => c.example_sentence).map((c) => c.example_sentence!),
    [cards]
  );

  const phases: Phase[] = useMemo(() => {
    if (!step) return [];
    const list: Phase[] = [];
    if (step.content.sections.length > 0) list.push("intro");
    if (cards.length > 0) list.push("vocab");
    if (pronunciationPhrases.length > 0) list.push("pronunciation");
    if (step.content.exercises.length > 0) list.push("quiz");
    list.push("done");
    return list;
  }, [step, cards, pronunciationPhrases]);

  if (allowed === false) {
    router.replace("/learn");
    return <p className="text-stone-400">Este paso todavía no está desbloqueado...</p>;
  }

  if (!step || phases.length === 0) {
    return <p className="text-stone-400">Cargando paso...</p>;
  }

  const phase = phases[phaseIndex];

  function goNext() {
    setPhaseIndex((i) => Math.min(i + 1, phases.length - 1));
  }

  async function persistCompletion(score: number) {
    if (!user || saving) return;
    setSaving(true);
    try {
      await markStepComplete(user.id, step!.id, score);
    } finally {
      setSaving(false);
    }
  }

  const isExam = step.step_type === "exam";
  const totalExercises = step.content.exercises.length;
  const correctCount = step.content.exercises.filter(
    (ex, i) => answers[i] === ex.answer
  ).length;
  const quizScore = totalExercises > 0 ? correctCount / totalExercises : 1;
  const examPassed = !isExam || quizScore >= EXAM_PASS_SCORE;

  function retryExam() {
    setAnswers({});
    setQuizChecked(false);
  }

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-6">
      <Link href="/learn" className="text-sm text-stone-500 hover:text-stone-300">
        ← Volver a la ruta
      </Link>

      <div>
        <span className="text-xs uppercase tracking-wide text-amber-400">
          {step.level} · {step.topic}
        </span>
        <h1 className="text-2xl font-bold">{step.title}</h1>
      </div>

      <div className="flex gap-1.5">
        {phases
          .filter((p) => p !== "done")
          .map((p, i) => (
            <div
              key={p}
              className={`h-1.5 flex-1 rounded-full ${
                i < phaseIndex
                  ? "bg-amber-500"
                  : i === phaseIndex
                    ? "bg-amber-500/60"
                    : "bg-stone-800"
              }`}
            />
          ))}
      </div>

      {phase === "intro" && (
        <div className="space-y-4">
          {step.content.sections.map((section, i) => (
            <div key={i} className="rounded-2xl border border-stone-800 bg-stone-900/40 p-4">
              <h3 className="mb-1 font-semibold text-stone-100">{section.heading}</h3>
              <p className="text-sm leading-relaxed text-stone-400">{section.body}</p>
            </div>
          ))}
          <button
            onClick={goNext}
            className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-stone-950 hover:bg-amber-400"
          >
            Continuar
          </button>
        </div>
      )}

      {phase === "vocab" && (
        <div className="space-y-4">
          <p className="text-center text-xs text-stone-500">
            Palabra {vocabIndex + 1} / {cards.length}
          </p>
          <button
            onClick={() => setVocabFlipped((f) => !f)}
            className="flex min-h-[220px] w-full flex-col items-center justify-center rounded-3xl border border-stone-800 bg-stone-900/60 p-8 text-center transition hover:border-amber-500/40"
          >
            {!vocabFlipped ? (
              <>
                <p className="text-3xl font-bold">
                  {cards[vocabIndex].article && (
                    <span className={`${articleClass[cards[vocabIndex].article!]} mr-2`}>
                      {cards[vocabIndex].article}
                    </span>
                  )}
                  {cards[vocabIndex].word}
                </p>
                <p className="mt-3 text-xs uppercase tracking-wide text-stone-500">
                  Toca para ver la traducción
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-semibold text-amber-300">
                  {cards[vocabIndex].translation}
                </p>
                {cards[vocabIndex].example_sentence && (
                  <div className="mt-4 space-y-1 text-sm text-stone-400">
                    <p>{cards[vocabIndex].example_sentence}</p>
                    <p className="italic">{cards[vocabIndex].example_translation}</p>
                  </div>
                )}
              </>
            )}
          </button>
          <SpeakButton
            getText={() => {
              const card = cards[vocabIndex];
              return vocabFlipped
                ? card.example_sentence || card.word
                : card.article
                  ? `${card.article} ${card.word}`
                  : card.word;
            }}
          />
          <button
            onClick={() => {
              if (vocabIndex + 1 < cards.length) {
                setVocabIndex((i) => i + 1);
                setVocabFlipped(false);
              } else {
                goNext();
              }
            }}
            className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-stone-950 hover:bg-amber-400"
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
          <div className="rounded-2xl border border-stone-800 bg-stone-900/50 p-5 text-center">
            <p className="mb-3 text-lg font-semibold">{pronunciationPhrases[pronIndex]}</p>
            <div className="flex items-center justify-center gap-3">
              <SpeakButton
                getText={() => pronunciationPhrases[pronIndex]}
                label="Nativo"
                stopPropagation={false}
              />
              {supported && (
                <button
                  onClick={() => (listening ? stop() : start())}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                    listening ? "animate-pulse bg-stone-700" : "bg-rose-600 hover:bg-rose-500"
                  }`}
                >
                  {listening ? "⏹ Parar" : "🎙️ Repetir en voz alta"}
                </button>
              )}
            </div>
            {transcript && (
              <div className="mt-4 rounded-xl bg-stone-950 p-3 text-left">
                <p className="text-xs text-stone-500">Se reconoció:</p>
                <p className="text-sm">{transcript}</p>
                <p className="mt-1 text-sm font-semibold text-amber-400">
                  Coincidencia:{" "}
                  {Math.round(similarityScore(pronunciationPhrases[pronIndex], transcript) * 100)}%
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
            className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-stone-950 hover:bg-amber-400"
          >
            {pronIndex + 1 < pronunciationPhrases.length ? "Siguiente frase" : "Continuar"}
          </button>
        </div>
      )}

      {phase === "quiz" && (
        <div className="space-y-3">
          <h2 className="font-semibold">
            {isExam ? "Examen: repasa lo aprendido" : "Ejercicios"}
          </h2>
          {isExam && !quizChecked && (
            <p className="text-xs text-stone-500">
              Necesitas al menos el {Math.round(EXAM_PASS_SCORE * 100)}% de aciertos
              para aprobar y desbloquear el siguiente paso. Si no llegas, podrás
              repasar tus fallos e intentarlo de nuevo.
            </p>
          )}
          {step.content.exercises.map((ex, i) => (
            <div key={i} className="rounded-2xl border border-stone-800 bg-stone-900/40 p-4">
              <p className="mb-2 text-sm">{ex.prompt}</p>
              <div className="flex flex-wrap gap-2">
                {ex.choices?.map((choice) => {
                  const isSelected = answers[i] === choice;
                  const isCorrect = quizChecked && choice === ex.answer;
                  const isWrongSelected = quizChecked && isSelected && choice !== ex.answer;
                  return (
                    <button
                      key={choice}
                      disabled={quizChecked}
                      onClick={() => setAnswers((a) => ({ ...a, [i]: choice }))}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                        isCorrect
                          ? "border-emerald-500 bg-emerald-950/60 text-emerald-300"
                          : isWrongSelected
                            ? "border-rose-500 bg-rose-950/60 text-rose-300"
                            : isSelected
                              ? "border-amber-500 bg-amber-950/40 text-amber-300"
                              : "border-stone-700 text-stone-300 hover:border-stone-500"
                      }`}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
              {quizChecked && ex.explanation && (
                <p className="mt-2 text-xs text-stone-500">{ex.explanation}</p>
              )}
            </div>
          ))}

          {!quizChecked ? (
            <button
              onClick={() => setQuizChecked(true)}
              className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-stone-950 hover:bg-amber-400"
            >
              Corregir ejercicios
            </button>
          ) : (
            <div className="space-y-4">
              {(() => {
                const mistakes = step.content.exercises
                  .map((ex, i) => ({ ex, i }))
                  .filter(({ ex, i }) => answers[i] !== ex.answer);
                if (mistakes.length === 0) return null;
                return (
                  <div className="rounded-2xl border border-rose-800/40 bg-rose-950/15 p-4">
                    <p className="mb-2 text-sm font-semibold text-rose-300">
                      Fallos a repasar
                    </p>
                    <ul className="space-y-2 text-sm">
                      {mistakes.map(({ ex, i }) => (
                        <li key={i} className="border-t border-rose-900/30 pt-2 first:border-0 first:pt-0">
                          <p className="text-stone-300">{ex.prompt}</p>
                          <p className="text-rose-400">
                            Tu respuesta: {answers[i] ?? "—"}
                          </p>
                          <p className="text-emerald-400">Correcta: {ex.answer}</p>
                          {ex.explanation && (
                            <p className="text-xs text-stone-500">{ex.explanation}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}

              <div className="text-center">
                <p className="text-sm text-stone-300">
                  {correctCount} / {totalExercises} correctas
                  {isExam && ` (${Math.round(quizScore * 100)}%)`}
                </p>

                {isExam && !examPassed ? (
                  <>
                    <p className="mt-1 text-sm font-semibold text-rose-400">
                      No aprobado: necesitas al menos {Math.round(EXAM_PASS_SCORE * 100)}%.
                    </p>
                    <button
                      onClick={retryExam}
                      className="mt-3 w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-stone-950 hover:bg-amber-400"
                    >
                      🔁 Reintentar examen
                    </button>
                  </>
                ) : (
                  <>
                    {isExam && (
                      <p className="mt-1 text-sm font-semibold text-emerald-400">
                        ✅ Examen aprobado
                      </p>
                    )}
                    <button
                      onClick={goNext}
                      className="mt-3 w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-stone-950 hover:bg-amber-400"
                    >
                      Continuar
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {phase === "done" && (
        <div className="space-y-4 rounded-2xl border border-emerald-800/40 bg-emerald-950/20 p-8 text-center">
          <p className="text-4xl">🎉</p>
          <h2 className="text-lg font-semibold">
            {isExam ? "¡Examen aprobado!" : "¡Paso completado!"}
          </h2>
          <StepDoneAction
            step={step}
            score={quizScore}
            onComplete={persistCompletion}
            saving={saving}
          />
        </div>
      )}
    </div>
  );
}

function StepDoneAction({
  step,
  score,
  onComplete,
  saving,
}: {
  step: PathStep;
  score: number;
  onComplete: (score: number) => void;
  saving: boolean;
}) {
  const router = useRouter();
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (triggeredRef.current) return;
    triggeredRef.current = true;
    onComplete(score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      onClick={() => router.push("/learn")}
      disabled={saving}
      className="w-full rounded-lg bg-stone-800 py-2.5 text-sm font-semibold hover:bg-stone-700 disabled:opacity-50"
    >
      {saving ? "Guardando progreso..." : `Volver a la ruta de ${step.level}`}
    </button>
  );
}

export default function LearnStepPage() {
  return (
    <RequireAuth>
      <StepContent />
    </RequireAuth>
  );
}
