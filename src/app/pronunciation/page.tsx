"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/components/AuthProvider";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { speakGerman, similarityScore } from "@/lib/speech";
import { getAllDecksWithCards } from "@/lib/data/flashcards";
import {
  savePronunciationAttempt,
  getRecentPronunciationAttempts,
  uploadPronunciationAudio,
  getPronunciationAudioUrl,
} from "@/lib/data/pronunciation";
import type { PronunciationAttempt } from "@/lib/types/database";

interface Practice {
  text: string;
  translation: string;
}

function HistoryItem({
  attempt,
  onRepeat,
}: {
  attempt: PronunciationAttempt;
  onRepeat: (phrase: string) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  async function handlePlay() {
    if (!attempt.audio_path) return;
    setPlaying(true);
    try {
      const url = audioUrl ?? (await getPronunciationAudioUrl(attempt.audio_path));
      setAudioUrl(url);
      new Audio(url).play();
    } finally {
      setPlaying(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-stone-800 bg-stone-900/30 px-3 py-2 text-sm">
      <span className="min-w-0 flex-1 truncate">{attempt.phrase}</span>
      <div className="flex shrink-0 items-center gap-2">
        {attempt.audio_path && (
          <button
            onClick={handlePlay}
            disabled={playing}
            aria-label="Escuchar grabación"
            className="text-stone-400 hover:text-amber-300 disabled:opacity-50"
          >
            ▶
          </button>
        )}
        <button
          onClick={() => onRepeat(attempt.phrase)}
          aria-label="Repetir esta frase"
          className="text-stone-400 hover:text-amber-300"
        >
          🔁
        </button>
        <span
          className={`w-14 text-right ${
            attempt.is_match ? "text-emerald-400" : "text-stone-500"
          }`}
        >
          {attempt.is_match === null ? "—" : attempt.is_match ? "✓ bien" : "revisar"}
        </span>
      </div>
    </div>
  );
}

function PronunciationContent() {
  const { user } = useAuth();
  const [pool, setPool] = useState<Practice[]>([]);
  const [current, setCurrent] = useState<Practice | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<PronunciationAttempt[]>([]);
  const [tips, setTips] = useState<string[] | null>(null);
  const [loadingTips, setLoadingTips] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { supported, listening, transcript, error, start, stop } =
    useSpeechRecognition({
      // El reconocimiento detecta por sí solo el silencio al final de la
      // frase y termina; en ese momento cerramos también la grabación de
      // audio, tanto si fue automático como si el usuario tocó "Parar".
      onEnd: () => {
        mediaRecorderRef.current?.stop();
        setRecording(false);
      },
    });

  const loadHistory = useCallback(() => {
    if (user) getRecentPronunciationAttempts(user.id).then(setHistory);
  }, [user]);

  useEffect(() => {
    getAllDecksWithCards().then(({ cards }) => {
      const fromCards = cards
        .filter((c) => c.example_sentence)
        .map((c) => ({
          text: c.example_sentence!,
          translation: c.example_translation ?? "",
        }));
      setPool(fromCards);
      setCurrent(fromCards[Math.floor(Math.random() * fromCards.length)] ?? null);
    });
    loadHistory();
  }, [loadHistory]);

  const pickRandom = useCallback(() => {
    if (pool.length === 0) return;
    setCurrent(pool[Math.floor(Math.random() * pool.length)]);
    setAudioBlob(null);
    setAudioUrl(null);
    setTips(null);
  }, [pool]);

  function repeatPhrase(phrase: string) {
    const fromPool = pool.find((p) => p.text === phrase);
    setCurrent(fromPool ?? { text: phrase, translation: "" });
    setAudioBlob(null);
    setAudioUrl(null);
    setTips(null);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setAudioUrl(null);
      setTips(null);
      setRecording(true);
      start();
    } catch {
      setRecording(false);
    }
  }

  function stopRecording() {
    if (supported) {
      stop();
    } else {
      mediaRecorderRef.current?.stop();
      setRecording(false);
    }
  }

  const score = current && transcript ? similarityScore(current.text, transcript) : null;

  async function handleSaveAttempt() {
    if (!user || !current) return;
    setSaving(true);
    try {
      let audioPath: string | null = null;
      if (audioBlob) audioPath = await uploadPronunciationAudio(user.id, audioBlob);
      await savePronunciationAttempt(
        user.id,
        current.text,
        transcript || null,
        score !== null ? score > 0.75 : null,
        audioPath
      );
      loadHistory();
    } finally {
      setSaving(false);
    }
  }

  async function handleGetTips() {
    if (!current) return;
    setLoadingTips(true);
    setTips(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "pronunciation-feedback",
          phrase: current.text,
          transcript,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "No se pudo generar el consejo.");
      setTips(body.tips ?? []);
    } catch (err) {
      setTips([err instanceof Error ? err.message : "Error desconocido."]);
    } finally {
      setLoadingTips(false);
    }
  }

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pronunciación</h1>
        <p className="text-stone-400">
          Escucha, grábate y compara. Practica en voz alta como si hablaras con alguien de verdad.
        </p>
      </div>

      {!current ? (
        <p className="text-stone-500">Cargando frases de práctica...</p>
      ) : (
        <div className="space-y-4 rounded-2xl border border-stone-800 bg-stone-900/50 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xl font-semibold">{current.text}</p>
              {current.translation && (
                <p className="text-sm text-stone-500 italic">{current.translation}</p>
              )}
            </div>
            <button
              onClick={() => speakGerman(current.text)}
              className="shrink-0 rounded-full border border-stone-700 px-3 py-1.5 text-sm hover:border-amber-500"
            >
              🔊 Nativo
            </button>
          </div>

          {!supported && (
            <p className="text-xs text-amber-400">
              Tu navegador no soporta reconocimiento de voz (funciona mejor en Chrome).
              Puedes seguir grabando y comparando de oído.
            </p>
          )}

          <div className="flex items-center gap-3">
            {!recording ? (
              <button
                onClick={startRecording}
                className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold hover:bg-rose-500"
              >
                🎙️ Grabar
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="rounded-full bg-stone-700 px-5 py-2.5 text-sm font-semibold animate-pulse"
              >
                ⏹ Parar
              </button>
            )}
            <button
              onClick={pickRandom}
              className="rounded-full border border-stone-700 px-4 py-2 text-sm hover:border-amber-500"
            >
              Otra frase
            </button>
          </div>

          {listening && (
            <p className="text-xs text-stone-500">
              Escuchando... se detiene sola al terminar la frase.
            </p>
          )}
          {error && <p className="text-xs text-rose-400">Error: {error}</p>}

          {transcript && (
            <div className="rounded-xl bg-stone-950 p-3">
              <p className="text-xs text-stone-500">Se reconoció:</p>
              <p className="text-sm">{transcript}</p>
              {score !== null && (
                <p
                  className={`mt-1 text-sm font-semibold ${
                    score > 0.75 ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  Coincidencia: {Math.round(score * 100)}%
                </p>
              )}
            </div>
          )}

          {audioUrl && (
            <div className="flex items-center gap-2">
              <audio controls src={audioUrl} className="w-full" />
            </div>
          )}

          {(transcript || audioUrl) && (
            <div className="flex flex-wrap gap-2">
              {user && (
                <button
                  onClick={handleSaveAttempt}
                  disabled={saving}
                  className="flex-1 rounded-lg bg-amber-500 py-2 text-sm font-semibold text-stone-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar intento"}
                </button>
              )}
              <button
                onClick={handleGetTips}
                disabled={loadingTips}
                className="flex-1 rounded-lg bg-violet-600 py-2 text-sm font-semibold hover:bg-violet-500 disabled:opacity-50"
              >
                {loadingTips ? "Pensando..." : "💡 Consejo de la IA"}
              </button>
            </div>
          )}

          {tips && tips.length > 0 && (
            <div className="rounded-xl border border-violet-800/40 bg-violet-950/20 p-3">
              <p className="mb-1.5 text-xs font-semibold text-violet-300">
                Cómo mejorar tu pronunciación:
              </p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-stone-300">
                {tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-stone-400">
            Intentos recientes
          </h2>
          <div className="space-y-1.5">
            {history.map((h) => (
              <HistoryItem key={h.id} attempt={h} onRepeat={repeatPhrase} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PronunciationPage() {
  return (
    <RequireAuth>
      <PronunciationContent />
    </RequireAuth>
  );
}
