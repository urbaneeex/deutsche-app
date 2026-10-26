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
import { DAILY_GOAL_XP, getXp } from "@/lib/dailyGoal";
import type { PathStep } from "@/lib/types/database";

function LearnContent() {
  const { user } = useAuth();
  const [steps, setSteps] = useState<PathStep[] | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [due, setDue] = useState<number | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [xp, setXp] = useState(0);

  useEffect(() => {
    getPathSteps().then(setSteps);
  }, []);

  useEffect(() => {
    if (!user) return;
    Promise.resolve(getXp(user.id).xp).then(setXp);
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

  const nextStep = useMemo(() => {
    if (!steps) return null;
    for (const level of levels) {
      const idx = level.steps.findIndex((st) => !completed.has(st.id));
      if (idx >= 0 && isStepUnlocked(level.steps, idx, completed)) return level.steps[idx];
    }
    return null;
  }, [steps, levels, completed]);

  if (!steps) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-24 animate-pulse rounded-3xl bg-stone-900" />
        <div className="h-16 animate-pulse rounded-2xl bg-stone-900" />
        <div className="h-16 animate-pulse rounded-2xl bg-stone-900" />
      </div>
    );
  }

  const effectiveLevel = selectedLevel ?? defaultLevel;
  const current = levels.find((l) => l.level === effectiveLevel);

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center justify-between gap-4 rounded-3xl border border-stone-800 bg-gradient-to-br from-stone-900 to-stone-900/40 p-4">
        <div className="min-w-0">
          <p className="text-sm text-stone-400">
            {streak && streak > 0 ? "Racha actual" : "¡Empieza hoy!"}
          </p>
          <p className="text-3xl font-extrabold">
            {streak ?? 0} <span className="text-2xl">🔥</span>
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {xp >= DAILY_GOAL_XP
              ? "Meta diaria cumplida 🎉"
              : `${DAILY_GOAL_XP - xp} XP para tu meta de hoy`}
          </p>
        </div>
        <div className="relative h-20 w-20 shrink-0">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-stone-800" strokeWidth="4" />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              className={xp >= DAILY_GOAL_XP ? "stroke-emerald-400" : "stroke-amber-400"}
              strokeDasharray={`${Math.min(xp / DAILY_GOAL_XP, 1) * 97.4} 97.4`}
              style={{ transition: "stroke-dasharray 0.6s ease" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
            {Math.min(xp, DAILY_GOAL_XP)}
            <span className="text-[10px] font-normal text-stone-500">/{DAILY_GOAL_XP}</span>
          </span>
        </div>
      </div>

      {due !== null && due > 0 && (
        <Link
          href="/practice"
          className="flex items-center gap-3 rounded-2xl border border-sky-500/40 bg-sky-950/30 p-4 transition active:scale-[0.99]"
        >
          <span className="text-2xl">🧠</span>
          <div className="flex-1">
            <p className="font-semibold text-sky-200">Repaso del día</p>
            <p className="text-xs text-sky-300/70">
              {due} tarjeta{due === 1 ? "" : "s"} por repasar · 3 min
            </p>
          </div>
          <span className="text-sky-300">›</span>
        </Link>
      )}

      {nextStep && (
        <Link
          href={`/learn/${nextStep.slug}`}
          className="block rounded-3xl bg-amber-500 p-5 text-stone-950 shadow-lg shadow-amber-500/10 transition active:scale-[0.99]"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-amber-900">
            {completed.size === 0 ? "Empieza aquí" : "Continuar"} · {nextStep.level}
          </p>
          <p className="text-xl font-extrabold">{nextStep.title}</p>
          <p className="mt-2 text-sm font-semibold">
            {nextStep.step_type === "exam" ? "Hacer el examen" : "Empezar lección"} →
          </p>
        </Link>
      )}

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
                  className={`flex items-center gap-3 rounded-2xl border p-4 transition active:scale-[0.99] ${
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
