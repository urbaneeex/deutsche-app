import { Fragment } from "react";

/** Resalta el alemán entre comillas simples ('ich bin') y parte los
 * párrafos largos en frases para que se lean bien en el móvil. */
function highlight(text: string) {
  return text.split(/('[^']+')/g).map((part, i) =>
    part.startsWith("'") && part.endsWith("'") && part.length > 2 ? (
      <span key={i} className="rounded bg-amber-500/10 px-1 font-semibold text-amber-300">
        {part.slice(1, -1)}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}

export default function RichText({ text }: { text: string }) {
  const sentences = text.length > 200 ? text.split(/(?<=[.:])\s+(?=[A-ZÁÉÍÓÚÑ¿'])/) : [text];
  return (
    <div className="space-y-2 text-[15px] leading-relaxed text-stone-300">
      {sentences.map((s, i) => (
        <p key={i}>{highlight(s)}</p>
      ))}
    </div>
  );
}
