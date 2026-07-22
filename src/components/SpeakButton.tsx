"use client";

import { useState } from "react";
import { speakGerman } from "@/lib/speech";
import { IconVolume } from "@/components/icons";

const DEFAULT_CLASS =
  "flex items-center gap-1.5 rounded-full border border-stone-700 px-3 py-1.5 text-xs text-stone-300 transition hover:border-amber-500 disabled:opacity-50";

/**
 * Botón de "Escuchar" que reproduce alemán con la Web Speech API. A
 * diferencia de una llamada directa a speakGerman(), muestra un aviso
 * cuando el audio no puede reproducirse (sin voces alemanas instaladas,
 * navegador sin soporte, fallo silencioso conocido de Chrome/Android...)
 * en vez de no hacer absolutamente nada, que es indistinguible de un bug.
 */
export default function SpeakButton({
  getText,
  label = "Escuchar",
  icon = true,
  className,
  stopPropagation = true,
  ariaLabel,
}: {
  getText: () => string;
  label?: string;
  icon?: boolean;
  className?: string;
  stopPropagation?: boolean;
  ariaLabel?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick(e: React.MouseEvent) {
    if (stopPropagation) e.stopPropagation();
    const text = getText();
    if (!text) return;
    setBusy(true);
    setError(null);
    const result = await speakGerman(text);
    setBusy(false);
    if (!result.ok) setError(result.reason);
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-label={ariaLabel ?? (label ? undefined : "Escuchar")}
        className={className ?? DEFAULT_CLASS}
      >
        {icon && <IconVolume size={14} />}
        {busy ? "..." : label}
      </button>
      {error && (
        <p className="max-w-[220px] text-center text-[11px] leading-tight text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
