"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import RequireAuth from "@/components/RequireAuth";
import { getGrammarLessons, getCompletedLessonIds } from "@/lib/data/lessons";
import type { GrammarLesson } from "@/lib/types/database";

function LessonsContent() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<GrammarLesson[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    getGrammarLessons().then(setLessons);
    if (user) getCompletedLessonIds(user.id).then(setCompleted);
  }, [user]);

  const byLevel = lessons.reduce<Record<string, GrammarLesson[]>>((acc, l) => {
    (acc[l.level] ??= []).push(l);
    return acc;
  }, {});

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Gramática, de cero a nativo</h1>
        <p className="text-stone-400">
          Pronombres, casos, verbos y las excepciones que nadie te explica.
        </p>
      </div>

      {Object.entries(byLevel).map(([level, items]) => (
        <div key={level}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-400">
            Nivel {level}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/lessons/${lesson.slug}`}
                className="rounded-2xl border border-stone-800 bg-stone-900/50 p-4 transition hover:border-amber-500/50 hover:bg-stone-900"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-stone-500">{lesson.topic}</span>
                  {completed.has(lesson.id) && (
                    <span className="text-xs text-emerald-400">✓ hecha</span>
                  )}
                </div>
                <h3 className="font-semibold">{lesson.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {lessons.length === 0 && (
        <p className="text-sm text-stone-500">
          No hay lecciones cargadas todavía. Ejecuta{" "}
          <code className="rounded bg-stone-800 px-1">npm run db:seed</code>.
        </p>
      )}
    </div>
  );
}

export default function LessonsPage() {
  return (
    <RequireAuth>
      <LessonsContent />
    </RequireAuth>
  );
}
