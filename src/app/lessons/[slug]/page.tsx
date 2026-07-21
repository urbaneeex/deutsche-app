"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import RequireAuth from "@/components/RequireAuth";
import { getGrammarLessonBySlug, markLessonComplete } from "@/lib/data/lessons";
import type { GrammarLesson } from "@/lib/types/database";

function LessonContent() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<GrammarLesson | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getGrammarLessonBySlug(params.slug).then(setLesson);
  }, [params.slug]);

  if (!lesson) return <p className="text-stone-400">Cargando lección...</p>;

  const correctCount = lesson.content.exercises.filter(
    (ex, i) => answers[i] === ex.answer
  ).length;

  async function handleFinish() {
    setChecked(true);
    if (user && !saved) {
      const total = lesson!.content.exercises.length;
      const score = total > 0 ? correctCount / total : 1;
      await markLessonComplete(user.id, lesson!.id, score);
      setSaved(true);
    }
  }

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-6">
      <Link href="/lessons" className="text-sm text-stone-500 hover:text-stone-300">
        ← Todas las lecciones
      </Link>

      <div>
        <span className="text-xs uppercase tracking-wide text-amber-400">
          {lesson.level} · {lesson.topic}
        </span>
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
      </div>

      <div className="space-y-4">
        {lesson.content.sections.map((section, i) => (
          <div key={i} className="rounded-2xl border border-stone-800 bg-stone-900/40 p-4">
            <h3 className="mb-1 font-semibold text-stone-100">{section.heading}</h3>
            <p className="text-sm leading-relaxed text-stone-400">{section.body}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold">Ejercicios</h2>
        {lesson.content.exercises.map((ex, i) => (
          <div key={i} className="rounded-2xl border border-stone-800 bg-stone-900/40 p-4">
            <p className="mb-2 text-sm">{ex.prompt}</p>
            <div className="flex flex-wrap gap-2">
              {ex.choices?.map((choice) => {
                const isSelected = answers[i] === choice;
                const isCorrect = checked && choice === ex.answer;
                const isWrongSelected = checked && isSelected && choice !== ex.answer;
                return (
                  <button
                    key={choice}
                    disabled={checked}
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
            {checked && ex.explanation && (
              <p className="mt-2 text-xs text-stone-500">{ex.explanation}</p>
            )}
          </div>
        ))}
      </div>

      {!checked ? (
        <button
          onClick={handleFinish}
          className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-stone-950 hover:bg-amber-400"
        >
          Corregir ejercicios
        </button>
      ) : (
        <div className="space-y-3 text-center">
          <p className="text-sm text-stone-300">
            {correctCount} / {lesson.content.exercises.length} correctas
          </p>
          <button
            onClick={() => router.push("/lessons")}
            className="w-full rounded-lg bg-stone-800 py-2.5 text-sm font-semibold hover:bg-stone-700"
          >
            Volver a lecciones
          </button>
        </div>
      )}
    </div>
  );
}

export default function LessonPage() {
  return (
    <RequireAuth>
      <LessonContent />
    </RequireAuth>
  );
}
