"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import { getSituationBySlug } from "@/lib/data/situations";
import { speakGerman, similarityScore } from "@/lib/speech";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { IconMic, IconVolume } from "@/components/icons";
import type { Article, Situation } from "@/lib/types/database";

interface Correction {
  has_issues: boolean;
  corrected: string | null;
  explanation: string | null;
}

interface VocabItem {
  word: string;
  article: Article;
  translation: string;
}

interface LiveTurn {
  id: string;
  isUser: boolean;
  speaker: string;
  text_de: string;
  text_es?: string;
  correction?: Correction;
  vocab?: VocabItem[];
}

const articleClass: Record<string, string> = {
  der: "article-der",
  die: "article-die",
  das: "article-das",
};

/** Botón para repetir en voz alta una línea y comparar con lo que
 * realmente se dijo, sin necesidad de guardar nada: es solo práctica
 * rápida dentro de la propia conversación. */
function PracticeLine({ text }: { text: string }) {
  const [attempted, setAttempted] = useState(false);
  const { supported, listening, transcript, start, stop } = useSpeechRecognition();

  if (!supported) return null;

  const score = attempted && transcript ? similarityScore(text, transcript) : null;

  return (
    <div className="mt-2">
      <button
        onClick={() => {
          if (listening) {
            stop();
          } else {
            setAttempted(true);
            start();
          }
        }}
        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition ${
          listening
            ? "animate-pulse border-rose-500 text-rose-300"
            : "border-stone-700 text-stone-400 hover:border-amber-500 hover:text-amber-300"
        }`}
      >
        <IconMic size={12} />
        {listening ? "Escuchando..." : "Practicar pronunciación"}
      </button>
      {attempted && transcript && (
        <p className="mt-1.5 text-[11px] text-stone-500">
          Se oyó: <span className="text-stone-300">{transcript}</span>
          {score !== null && (
            <span
              className={`ml-1.5 font-semibold ${
                score > 0.75 ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {Math.round(score * 100)}%
            </span>
          )}
        </p>
      )}
    </div>
  );
}

function SituationContent() {
  const params = useParams<{ slug: string }>();
  const [situation, setSituation] = useState<Situation | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [staticHistory, setStaticHistory] = useState<number[]>([0]);
  const [freeMode, setFreeMode] = useState(false);
  const [turns, setTurns] = useState<LiveTurn[]>([]);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const {
    supported: micSupported,
    listening: micListening,
    transcript: micTranscript,
    start: micStart,
    stop: micStop,
  } = useSpeechRecognition({
    onEnd: () => {
      if (micTranscript.trim()) setInput(micTranscript.trim());
    },
  });

  useEffect(() => {
    let active = true;
    getSituationBySlug(params.slug).then((s) => {
      if (!active) return;
      setSituation(s);
      setStepIndex(0);
      setStaticHistory([0]);
      setFreeMode(false);
      setTurns([]);
      setSuggested([]);
      setInput("");
      setSendError(null);
    });
    return () => {
      active = false;
    };
  }, [params.slug]);

  if (!situation) return <p className="text-stone-400">Cargando...</p>;

  const step = situation.dialogue[stepIndex];
  const finished = !step.options || step.options.length === 0;
  const showFreeInput = freeMode || finished;
  const situationTitle = situation.title;
  const situationDescription = situation.description;

  function pickOption(next: number) {
    setStepIndex(next);
    setStaticHistory((h) => [...h, next]);
  }

  function restart() {
    setStepIndex(0);
    setStaticHistory([0]);
    setFreeMode(false);
    setTurns([]);
    setSuggested([]);
    setInput("");
    setSendError(null);
  }

  function buildHistoryForApi() {
    const base = staticHistory.map((idx) => {
      const s = situation!.dialogue[idx];
      return { speaker: s.speaker, text_de: s.text_de };
    });
    const dynamic = turns.map((t) => ({
      speaker: t.isUser ? "Du" : t.speaker,
      text_de: t.text_de,
    }));
    return [...base, ...dynamic];
  }

  async function sendMessage(rawMessage: string) {
    const message = rawMessage.trim();
    if (!message || pending) return;
    setFreeMode(true);
    setInput("");
    setSendError(null);
    setPending(message);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "situation-reply",
          situationTitle,
          situationContext: situationDescription,
          history: buildHistoryForApi(),
          userMessage: message,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error ?? "No se pudo continuar la conversación.");
      }

      setTurns((t) => [
        ...t,
        {
          id: `u-${Date.now()}`,
          isUser: true,
          speaker: "Tú",
          text_de: message,
          correction: body.correction,
        },
        {
          id: `n-${Date.now()}`,
          isUser: false,
          speaker: body.reply?.speaker ?? "—",
          text_de: body.reply?.text_de ?? "",
          text_es: body.reply?.text_es,
          vocab: body.vocab,
        },
      ]);
      setSuggested(body.options ?? []);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Error desconocido.");
      setInput(message);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-6">
      <Link href="/situations" className="text-sm text-stone-500 hover:text-stone-300">
        ← Todas las situaciones
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{situation.title}</h1>
        <p className="text-stone-400">{situation.description}</p>
      </div>

      <div className="space-y-3">
        {staticHistory.map((idx, i) => {
          const s = situation.dialogue[idx];
          return (
            <div key={`s-${i}`} className="rounded-2xl border border-stone-800 bg-stone-900/40 p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400">{s.speaker}</span>
                <button
                  onClick={() => speakGerman(s.text_de)}
                  aria-label="Escuchar"
                  className="rounded-full border border-stone-700 p-1.5 text-stone-400 hover:border-amber-500 hover:text-amber-300"
                >
                  <IconVolume size={13} />
                </button>
              </div>
              <p className="font-medium">{s.text_de}</p>
              <p className="text-sm text-stone-500 italic">{s.text_es}</p>
              <PracticeLine text={s.text_de} />
            </div>
          );
        })}

        {turns.map((t) =>
          t.isUser ? (
            <div key={t.id} className="ml-6 rounded-2xl border border-amber-800/40 bg-amber-950/10 p-3">
              <p className="mb-0.5 text-xs font-semibold text-amber-400">Tú</p>
              <p className="text-sm">{t.text_de}</p>
              {t.correction?.has_issues && (
                <div className="mt-2 rounded-lg border border-rose-800/40 bg-rose-950/20 p-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-300">
                    Corrección
                  </p>
                  <p className="text-sm text-emerald-300">{t.correction.corrected}</p>
                  {t.correction.explanation && (
                    <p className="mt-0.5 text-xs text-stone-400">{t.correction.explanation}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div key={t.id} className="rounded-2xl border border-stone-800 bg-stone-900/40 p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400">{t.speaker}</span>
                <button
                  onClick={() => speakGerman(t.text_de)}
                  aria-label="Escuchar"
                  className="rounded-full border border-stone-700 p-1.5 text-stone-400 hover:border-amber-500 hover:text-amber-300"
                >
                  <IconVolume size={13} />
                </button>
              </div>
              <p className="font-medium">{t.text_de}</p>
              {t.text_es && <p className="text-sm text-stone-500 italic">{t.text_es}</p>}
              <PracticeLine text={t.text_de} />
              {t.vocab && t.vocab.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {t.vocab.map((v, vi) => (
                    <span
                      key={vi}
                      className="rounded-full border border-stone-700 px-2 py-0.5 text-[10px] text-stone-400"
                    >
                      {v.article && (
                        <span className={`${articleClass[v.article]} mr-1`}>{v.article}</span>
                      )}
                      {v.word} · {v.translation}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {pending && (
          <div className="ml-6 rounded-2xl border border-stone-800 bg-stone-900/20 p-3 opacity-60">
            <p className="text-xs font-semibold text-amber-400">Tú</p>
            <p className="text-sm">{pending}</p>
            <p className="mt-1 text-xs text-stone-500">Pensando respuesta...</p>
          </div>
        )}
      </div>

      {!showFreeInput ? (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-stone-500">¿Qué respondes?</p>
          {step.options!.map((opt, i) => (
            <button
              key={i}
              onClick={() => pickOption(opt.next)}
              className="block w-full rounded-xl border border-stone-700 bg-stone-900/40 px-4 py-2.5 text-left text-sm hover:border-amber-500/60 hover:bg-stone-900"
            >
              {opt.text_de}
            </button>
          ))}
          <button
            onClick={() => setFreeMode(true)}
            className="text-xs text-stone-500 underline hover:text-stone-300"
          >
            Responder con tus propias palabras
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {suggested.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-wide text-stone-500">Ideas para responder</p>
              <div className="flex flex-wrap gap-2">
                {suggested.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(opt)}
                    disabled={!!pending}
                    className="rounded-full border border-stone-700 px-3 py-1.5 text-xs hover:border-amber-500/60 disabled:opacity-50"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Escribe tu respuesta en alemán..."
              rows={2}
              className="flex-1 resize-none rounded-xl border border-stone-700 bg-stone-950 px-3 py-2 text-sm outline-none focus:border-amber-500"
            />
            {micSupported && (
              <button
                onClick={() => (micListening ? micStop() : micStart())}
                aria-label="Dictar por voz"
                className={`shrink-0 rounded-xl border p-2.5 transition ${
                  micListening
                    ? "animate-pulse border-rose-500 text-rose-300"
                    : "border-stone-700 text-stone-400 hover:border-amber-500 hover:text-amber-300"
                }`}
              >
                <IconMic size={16} />
              </button>
            )}
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || !!pending}
              className="shrink-0 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-stone-950 hover:bg-amber-400 disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
          {sendError && <p className="text-xs text-rose-400">{sendError}</p>}
          <button
            onClick={restart}
            className="text-xs text-stone-500 underline hover:text-stone-300"
          >
            Reiniciar conversación
          </button>
        </div>
      )}
    </div>
  );
}

export default function SituationPage() {
  return (
    <RequireAuth>
      <SituationContent />
    </RequireAuth>
  );
}
