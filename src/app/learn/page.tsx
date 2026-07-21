"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import RequireAuth from "@/components/RequireAuth";
import {
  getPathSteps,
  getCompletedStepIds,
  summarizeLevels,
  isStepUnlocked,
  LEVEL_ORDER,
} from "@/lib/data/path";
import { countDue } from "@/lib/data/flashcards";
import { markActiveToday } from "@/lib/data/profile";
import type { PathStep } from "@/lib/types/database";

function LearnContent() {
  const { user } = useAuth();
  const [steps, setSteps] = useState<PathStep[] | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [due, setDue] = useState<number | null>(null);
  const [streak, setStreak] = useState<number | null>(null);

  useEffect(() => {
    getPathSteps().then(setSteps);
  }, []);

  useEffect(() => {
    if (!user) return;
    getCompletedStepIds(user.id).then(setCompleted);
    countDue(user.id).then(setDue).catch(() => setDue(0));
    markActiveToday(user.id)
      .then((profile) => setStreak(profile.streak_count))
      .catch(() => setStreak(0));
  }, [user]);

  const levels = useMemo(
    () => (steps ? summarizeLevels(steps, completed) : []),
    [steps, completed]
  );

  const defaultLevel = useMemo(() => {
    const firstUnfinished = levels.find((l) => l.available && l.percent < 100);
    const fallback = levels.find((l) => l.available);
    return (firstUnfinished ?? fallback)?.level ?? LEVEL_ORDER[0];
  }, [levels]);

  if (!steps) return <p className="text-stone-400">Cargando tu ruta...</p>;

  const effectiveLevel = selectedLevel ?? defaultLevel;
  const current = levels.find((l) => l.level === effectiveLevel);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tu ruta de alemán</h1>
        <p className="text-stone-400">
          {streak !== null && streak > 0
            ? `${streak} día${streak === 1 ? "" : "s"} de racha 🔥 · ${due ?? "…"} tarjetas pendientes`
            : "De cero a nativo, paso a paso."}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {levels.map((l) => (
          <button
            key={l.level}
            disabled={!l.available}
            onClick={() => setSelectedLevel(l.level)}
            className={`flex shrink-0 flex-col items-center rounded-2xl border px-4 py-2 transition ${
              !l.available
                ? "cursor-not-allowed border-stone-800 text-stone-600"
                : effectiveLevel === l.level
                  ? "border-amber-500 bg-amber-950/30 text-amber-300"
                  : "border-stone-700 text-stone-300 hover:border-stone-500"
            }`}
          >
            <span className="font-semibold">{l.level}</span>
            <span className="text-[10px]">
              {l.available ? `${l.percent}%` : "próximamente"}
            </span>
          </button>
        ))}
      </div>

      {current && current.available && (
        <div>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-stone-800">
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{ width: `${current.percent}%` }}
            />
          </div>

          <div className="relative space-y-3">
            {current.steps.map((step, i) => {
              const isDone = completed.has(step.id);
              const unlocked = isStepUnlocked(current.steps, i, completed);
              const isNext = unlocked && !isDone;

              const isExam = step.step_type === "exam";

              const node = (
                <div
                  className={`flex items-center gap-3 rounded-2xl border p-4 transition ${
                    isDone
                      ? "border-emerald-800/50 bg-emerald-950/20"
                      : isNext
                        ? isExam
                          ? "border-violet-500/60 bg-violet-950/20 hover:bg-violet-950/30"
                          : "border-amber-500/60 bg-amber-950/20 hover:bg-amber-950/30"
                        : "border-stone-800 bg-stone-900/30 opacity-60"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      isDone
                        ? "bg-emerald-500 text-emerald-950"
                        : isNext
                          ? isExam
                            ? "bg-violet-500 text-violet-950"
                            : "bg-amber-500 text-amber-950"
                          : "bg-stone-800 text-stone-500"
                    }`}
                  >
                    {isDone ? "✓" : unlocked ? (isExam ? "📝" : i + 1) : "🔒"}
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">
                      {isExam ? "Examen" : step.topic}
                    </p>
                    <p className="font-semibold">{step.title}</p>
                  </div>
                </div>
              );

              return unlocked ? (
                <Link key={step.id} href={`/learn/${step.slug}`}>
                  {node}
                </Link>
              ) : (
                <div key={step.id}>{node}</div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LearnPage() {
  return (
    <RequireAuth>
      <LearnContent />
    </RequireAuth>
  );
}
