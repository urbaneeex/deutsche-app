"use client";

import { useEffect, useRef, useState } from "react";
import { speakGerman } from "@/lib/speech";
import { haptic } from "@/lib/feedback";
import { isTypedCorrect, type Exercise } from "@/lib/exercises";
import SpeakButton from "@/components/SpeakButton";

export type QuizResult = { correct: number; total: number };

type Item = { id: number; ex: Exercise; retry: boolean };

/**
 * Quiz de una pregunta cada vez con corrección inmediata (estilo
 * Duolingo). Los fallos vuelven al final de la cola una vez para
 * reforzarlos, pero la puntuación solo cuenta el primer intento.
 */
export default function QuizRunner({
  exercises,
  onFinish,
  onAnswer,
}: {
  exercises: Exercise[];
  onFinish: (result: QuizResult) => void;
  /** Se llama en cada respuesta; `firstTry` es false en las repeticiones. */
  onAnswer?: (ex: Exercise, ok: boolean, firstTry: boolean) => void;
}) {
  const [queue, setQueue] = useState<Item[]>(() =>
    exercises.map((ex, id) => ({ id, ex, retry: false }))
  );
  const [pos, setPos] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState<boolean | null>(null);
  const [answered, setAnswered] = useState(0);
  const [combo, setCombo] = useState(0);
  const firstTry = useRef<Map<number, boolean>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);

  const item = queue[pos];
  const total = exercises.length;
  
  useEffect(() => {
    if (item?.ex.kind === "type") inputRef.current?.focus();
  }, [item]);

  if (!item) return null;
  const ex = item.ex;
  const canCheck = ex.kind === "type" ? typed.trim().length > 0 : selected !== null;

  function check() {
    if (checked !== null || !canCheck) return;
    const ok =
      ex.kind === "type" ? isTypedCorrect(typed, ex.answer) : selected === ex.answer;
    setChecked(ok);
    setCombo((c) => (ok ? c + 1 : 0));
    onAnswer?.(ex, ok, !item.retry);
    haptic(ok ? "ok" : "bad");
    if (!item.retry) {
      firstTry.current.set(item.id, ok);
      setAnswered((n) => n + 1);
    }
    if (!ok && !item.retry) {
      setQueue((q) => [...q, { ...item, retry: true }]);
    }
  }

  function next() {
    const upcoming = queue[pos + 1];
    if (!upcoming) {
      const correct = [...firstTry.current.values()].filter(Boolean).length;
      onFinish({ correct, total });
      return;
    }
    // Reproducir dentro del mismo gesto (requisito de iOS/Android).
    if (upcoming.ex.kind === "choice" && upcoming.ex.listen && upcoming.ex.audio) {
      void speakGerman(upcoming.ex.audio);
    }
    setPos(pos + 1);
    setSelected(null);
    setTyped("");
    setChecked(null);
  }

  const isListen = ex.kind === "choice" && ex.listen;

  return (
    <div
      className="space-y-5"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (checked === null) check();
          else next();
        }
      }}
    >
      <div className="h-2.5 overflow-hidden rounded-full bg-stone-800">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${(answered / total) * 100}%` }}
        />
      </div>

      <div key={`${item.id}-${item.retry}`} className="animate-fade-in space-y-5">
        {item.retry && (
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
            Otra vez, para que se quede 💪
          </p>
        )}
        <h2 className="text-xl font-bold leading-snug">{ex.prompt}</h2>

        {ex.audio && (
          <div className="flex justify-start">
            <SpeakButton
              getText={() => ex.audio!}
              label={isListen ? "Escuchar" : ""}
              ariaLabel="Escuchar"
              className={`flex items-center justify-center gap-2 rounded-2xl border border-sky-500/40 bg-sky-500/10 text-sky-300 transition active:scale-95 ${
                isListen ? "px-6 py-4 text-base font-semibold" : "h-11 w-11"
              }`}
            />
          </div>
        )}

        {ex.kind === "choice" ? (
          <div className="grid gap-2.5">
            {ex.choices.map((choice) => {
              const isSelected = selected === choice;
              const reveal = checked !== null;
              const state = reveal
                ? choice === ex.answer
                  ? "ok"
                  : isSelected
                    ? "bad"
                    : "idle"
                : isSelected
                  ? "sel"
                  : "idle";
              return (
                <button
                  key={choice}
                  disabled={reveal}
                  onClick={() => {
                    haptic("tap");
                    setSelected(choice);
                  }}
                  className={`min-h-14 rounded-2xl border-2 px-4 py-3 text-left text-base font-medium transition active:scale-[0.98] ${
                    state === "ok"
                      ? "border-emerald-500 bg-emerald-950/60 text-emerald-200"
                      : state === "bad"
                        ? "border-rose-500 bg-rose-950/60 text-rose-200"
                        : state === "sel"
                          ? "border-sky-400 bg-sky-950/40 text-sky-100"
                          : "border-stone-700 bg-stone-900/40 text-stone-200"
                  } ${reveal && state === "idle" ? "opacity-50" : ""}`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        ) : (
          <input
            ref={inputRef}
            value={typed}
            disabled={checked !== null}
            onChange={(e) => setTyped(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="done"
            placeholder="Escribe aquí…"
            className="w-full rounded-2xl border-2 border-stone-700 bg-stone-900/60 px-4 py-4 text-lg outline-none focus:border-sky-400 disabled:opacity-70"
          />
        )}
      </div>

      <div
        className={`fixed inset-x-0 bottom-0 z-50 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-colors ${
          checked === null
            ? "border-stone-800 bg-stone-950"
            : checked
              ? "border-emerald-800 bg-emerald-950"
              : "border-rose-800 bg-rose-950"
        }`}
      >
        <div className="mx-auto max-w-2xl space-y-3">
          {checked !== null && (
            <div className="animate-fade-in text-sm">
              <p className={`font-bold ${checked ? "text-emerald-300" : "text-rose-300"}`}>
                {checked
                  ? combo >= 3
                    ? `🔥 ¡${combo} seguidas!`
                    : "¡Correcto! 🎉"
                  : "Casi… ¡a la siguiente la clavas!"}
              </p>
              {!checked && (
                <p className="text-rose-200">
                  Respuesta: <strong>{ex.answer}</strong>
                </p>
              )}
              {ex.explanation && (
                <p className="mt-0.5 text-stone-300/80">{ex.explanation}</p>
              )}
            </div>
          )}
          <button
            onClick={checked === null ? check : next}
            disabled={checked === null && !canCheck}
            className={`w-full rounded-2xl py-3.5 text-base font-bold transition active:scale-[0.98] disabled:opacity-40 ${
              checked === null
                ? "bg-emerald-500 text-emerald-950"
                : checked
                  ? "bg-emerald-400 text-emerald-950"
                  : "bg-rose-400 text-rose-950"
            }`}
          >
            {checked === null ? "Comprobar" : "Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}
