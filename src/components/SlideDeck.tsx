"use client";

import { useState } from "react";
import { speakGerman } from "@/lib/speech";
import { haptic } from "@/lib/feedback";
import GermanText, { ExplainLine, SpanishText, plain } from "@/components/GermanText";
import { IconVolume } from "@/components/icons";
import type { Ex, Slide } from "@/data/visual/slides";

function say(text: string) {
  haptic("tap");
  void speakGerman(plain(text));
}

function Kicker({ label, tone }: { label: string; tone: string }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest ${tone}`}>
      {label}
    </span>
  );
}

function ExampleRow({ ex }: { ex: Ex }) {
  return (
    <button
      onClick={() => say(ex.de)}
      className="flex w-full items-center gap-4 rounded-2xl border border-stone-800 border-l-4 border-l-sky-500 bg-stone-900/70 p-4 text-left shadow-sm transition active:scale-[0.98]"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[22px] font-bold leading-snug">
          <GermanText text={ex.de} />
        </span>
        <span className="mt-1 block text-[15px] text-stone-400">{ex.es}</span>
      </span>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-300">
        <IconVolume size={20} />
      </span>
    </button>
  );
}

function Quick({
  slide,
  onAnswered,
}: {
  slide: Extract<Slide, { t: "quick" }>;
  onAnswered: (ok: boolean) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <p className="text-xs font-bold uppercase tracking-wide text-sky-400">⚡ Comprueba rápido</p>
      <h2 className="text-2xl font-bold leading-snug">{slide.q}</h2>
      <div className="grid gap-2.5">
        {slide.choices.map((c) => {
          const reveal = picked !== null;
          const state = !reveal
            ? "idle"
            : c === slide.a
              ? "ok"
              : c === picked
                ? "bad"
                : "dim";
          return (
            <button
              key={c}
              disabled={reveal}
              onClick={() => {
                setPicked(c);
                haptic(c === slide.a ? "ok" : "bad");
                onAnswered(c === slide.a);
              }}
              className={`min-h-14 rounded-2xl border-2 px-4 py-3 text-left text-lg font-medium transition active:scale-[0.98] ${
                state === "ok"
                  ? "border-emerald-500 bg-emerald-950/60 text-emerald-200"
                  : state === "bad"
                    ? "border-rose-500 bg-rose-950/60 text-rose-200"
                    : state === "dim"
                      ? "border-stone-800 text-stone-600"
                      : "border-stone-700 bg-stone-900/40"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <p className={`animate-fade-in text-sm ${picked === slide.a ? "text-emerald-300" : "text-rose-300"}`}>
          {picked === slide.a ? "¡Eso es! " : `Era «${slide.a}». `}
          {slide.why}
        </p>
      )}
    </div>
  );
}

function SlideBody({
  slide,
  onAnswered,
}: {
  slide: Slide;
  onAnswered: (ok: boolean) => void;
}) {
  switch (slide.t) {
    case "hook":
      return (
        <div className="relative flex min-h-[55vh] flex-col items-center justify-center gap-5 text-center">
          <div className="pointer-events-none absolute inset-x-0 top-1/4 mx-auto h-48 w-48 rounded-full bg-sky-500/20 blur-3xl" />
          <span className="relative animate-bounce text-8xl drop-shadow-lg">{slide.emoji}</span>
          <h2 className="relative text-4xl font-extrabold leading-tight tracking-tight">
            {slide.title}
          </h2>
          <p className="relative max-w-xs text-xl leading-relaxed text-stone-300">
            <SpanishText text={slide.text} />
          </p>
        </div>
      );
    case "rule":
      return (
        <div className="space-y-5">
          <Kicker label="Regla" tone="bg-sky-500/15 text-sky-300" />
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight">{slide.title}</h2>
          <p className="rounded-2xl bg-stone-900/80 p-4 text-xl leading-relaxed text-stone-200">
            <SpanishText text={slide.text} />
          </p>
          {slide.ex && (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-stone-500">
                Ejemplos · toca para oír
              </p>
              {slide.ex.map((ex) => (
                <ExampleRow key={ex.de} ex={ex} />
              ))}
            </div>
          )}
        </div>
      );
    case "points":
      return (
        <div className="space-y-5">
          <Kicker label="Apunta esto" tone="bg-sky-500/15 text-sky-300" />
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight">{slide.title}</h2>
          <ol className="space-y-3">
            {slide.items.map((item, k) => (
              <li
                key={k}
                className="flex gap-3 rounded-2xl border border-stone-800 bg-stone-900/70 p-4 text-[17px] leading-relaxed text-stone-200"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sm font-bold text-sky-300">
                  {k + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <ExplainLine text={item} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      );
    case "table": {
      const mode = slide.say ?? "both";
      return (
        <div className="space-y-4">
          <Kicker label="Tabla" tone="bg-amber-500/15 text-amber-300" />
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight">{slide.title}</h2>
          {slide.note && <p className="text-sm text-stone-500">{slide.note}</p>}
          <div className="space-y-2">
            {slide.rows.map(([l, r], i) => (
              <button
                key={i}
                disabled={mode === "none"}
                onClick={() => say(mode === "left" ? l : `${l} ${r}`)}
                className="flex w-full items-center gap-3 rounded-2xl border border-stone-800 bg-stone-900/70 p-2 pr-4 text-left transition active:scale-[0.98] disabled:active:scale-100"
              >
                <span className="min-w-[8.5rem] rounded-xl bg-stone-800 px-3 py-2.5 text-lg font-semibold text-stone-100">
                  <GermanText text={l} />
                </span>
                <span className="flex-1 text-right text-xl font-semibold">
                  {mode === "left" ? (
                    <span className="text-base font-normal text-stone-400">
                      <SpanishText text={r} />
                    </span>
                  ) : (
                    <GermanText text={r} />
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      );
    }
    case "versus":
      return (
        <div className="space-y-4">
          <Kicker label="Compara" tone="bg-violet-500/15 text-violet-300" />
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight">{slide.title}</h2>
          {(
            [
              [slide.a, slide.aLabel, "border-sky-500/60 bg-sky-950/40", "bg-sky-500 text-sky-950"],
              [slide.b, slide.bLabel, "border-violet-500/60 bg-violet-950/40", "bg-violet-500 text-violet-950"],
            ] as const
          ).map(([ex, label, box, tag], i) => (
            <button
              key={i}
              onClick={() => say(ex.de)}
              className={`block w-full rounded-2xl border-2 p-4 text-left transition active:scale-[0.98] ${box}`}
            >
              {label && (
                <span className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide ${tag}`}>
                  {label}
                </span>
              )}
              <span className="block text-[22px] font-bold leading-snug">
                <GermanText text={ex.de} />
              </span>
              <span className="mt-1 block text-[15px] text-stone-400">{ex.es}</span>
            </button>
          ))}
          <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-lg leading-relaxed text-amber-100">
            💡 {slide.why}
          </p>
        </div>
      );
    case "tip":
      return (
        <div className="flex min-h-[45vh] flex-col items-center justify-center gap-5 rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-transparent p-6 text-center">
          <span className="text-7xl">{slide.emoji}</span>
          <p className="text-2xl font-bold leading-relaxed">
            <SpanishText text={slide.text} />
          </p>
        </div>
      );
    case "quick":
      return <Quick slide={slide} onAnswered={onAnswered} />;
  }
}

/** Versión de estudio: todas las tarjetas seguidas, sin preguntas ni pantalla de bienvenida. */
export function SlideSheet({ slides }: { slides: Slide[] }) {
  return (
    <div className="space-y-10">
      {slides
        .filter((s) => s.t !== "quick")
        .map((slide, k) =>
          slide.t === "hook" ? (
            <div key={k} className="flex items-center gap-4 rounded-3xl bg-sky-500/10 p-5">
              <span className="text-5xl">{slide.emoji}</span>
              <div>
                <h2 className="text-2xl font-extrabold leading-tight">{slide.title}</h2>
                <p className="mt-1 text-base text-stone-300">
                  <SpanishText text={slide.text} />
                </p>
              </div>
            </div>
          ) : (
            <div key={k}>
              <SlideBody slide={slide} onAnswered={() => {}} />
            </div>
          )
        )}
    </div>
  );
}

/**
 * Explicación en tarjetas: una idea por pantalla, con ejemplos que
 * suenan al tocarlos y micro-preguntas para recordar en vez de solo leer.
 */
export default function SlideDeck({
  slides,
  onDone,
}: {
  slides: Slide[];
  onDone: () => void;
}) {
  const [i, setI] = useState(0);
  const [answered, setAnswered] = useState<Record<number, boolean>>({});
  const slide = slides[i];
  const needsAnswer = slide.t === "quick" && answered[i] === undefined;
  const last = i === slides.length - 1;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setI((n) => Math.max(0, n - 1))}
          disabled={i === 0}
          aria-label="Anterior"
          className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-stone-400 disabled:opacity-20 active:bg-stone-800"
        >
          ‹
        </button>
        <div className="flex flex-1 gap-1">
          {slides.map((_, k) => (
            <div
              key={k}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                k < i ? "bg-sky-500" : k === i ? "bg-sky-400" : "bg-stone-800"
              }`}
            />
          ))}
        </div>
        <span className="w-9 text-right text-xs text-stone-500">
          {i + 1}/{slides.length}
        </span>
      </div>

      <div key={i} className="animate-slide-in pb-28">
        <SlideBody
          slide={slide}
          onAnswered={(ok) => setAnswered((a) => ({ ...a, [i]: ok }))}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-800 bg-stone-950 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-2xl">
          <button
            disabled={needsAnswer}
            onClick={() => {
              haptic("tap");
              if (last) onDone();
              else setI(i + 1);
            }}
            className="w-full rounded-2xl bg-sky-500 py-3.5 text-base font-bold text-sky-950 transition active:scale-[0.98] disabled:opacity-30"
          >
            {last ? "¡Entendido! Vamos a practicar" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
}
