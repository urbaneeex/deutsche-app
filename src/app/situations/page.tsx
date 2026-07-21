"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import { getSituations } from "@/lib/data/situations";
import { IconSparkles } from "@/components/icons";
import type { Situation } from "@/lib/types/database";

function SituationsContent() {
  const [situations, setSituations] = useState<Situation[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState("");

  function load() {
    getSituations().then(setSituations);
  }

  useEffect(load, []);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "situation", topic: topic || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "No se pudo generar la situación.");
      }
      setTopic("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Situaciones reales</h1>
        <p className="text-stone-400">
          Conversaciones dinámicas con IA: sigue hablando con tus propias
          palabras o por voz y te corrige al instante.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {situations.map((s) => (
          <Link
            key={s.id}
            href={`/situations/${s.slug}`}
            className="rounded-2xl border border-stone-800 bg-stone-900/50 p-4 transition hover:border-amber-500/50 hover:bg-stone-900"
          >
            {s.source === "ai" && (
              <div className="mb-1 flex justify-end">
                <span className="rounded-full border border-violet-800/60 bg-violet-950/30 px-2 py-0.5 text-[10px] text-violet-300">
                  IA
                </span>
              </div>
            )}
            <h3 className="font-semibold">{s.title}</h3>
            <p className="text-sm text-stone-400">{s.description}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-stone-700 p-4">
        <p className="mb-2 text-sm text-stone-400">
          Genera una situación nueva con IA (por ejemplo: &quot;en el gimnasio&quot;,
          &quot;con el casero&quot;, &quot;en una entrevista de trabajo&quot;).
        </p>
        <div className="flex gap-2">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Tema de la situación (opcional)"
            className="flex-1 rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-sm outline-none focus:border-amber-500"
          />
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500 disabled:opacity-50"
          >
            <IconSparkles size={14} />
            {generating ? "Generando..." : "Generar"}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
      </div>
    </div>
  );
}

export default function SituationsPage() {
  return (
    <RequireAuth>
      <SituationsContent />
    </RequireAuth>
  );
}
