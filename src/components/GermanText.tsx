import { Fragment } from "react";

const ARTICLE: Record<string, string> = {
  der: "article-der",
  die: "article-die",
  das: "article-das",
};

/** Quita el marcado **negrita** para leer en voz alta. */
export function plain(text: string) {
  return text.replace(/\*\*/g, "");
}

/** Renderiza texto con **parte clave** resaltada y der/die/das con su
 * color de género, para que el cerebro asocie color ↔ género. */
export default function GermanText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
        const strong = part.startsWith("**") && part.endsWith("**");
        const inner = strong ? part.slice(2, -2) : part;
        const nodes = inner.split(/\b(der|die|das)\b/g).map((w, j) =>
          ARTICLE[w] ? (
            <span key={j} className={ARTICLE[w]}>
              {w}
            </span>
          ) : (
            <Fragment key={j}>{w}</Fragment>
          )
        );
        return strong ? (
          <mark
            key={i}
            className="rounded-md bg-amber-400/15 px-1 font-extrabold text-amber-300"
          >
            {nodes}
          </mark>
        ) : (
          <Fragment key={i}>{nodes}</Fragment>
        );
      })}
    </>
  );
}

/** Igual pero para textos en español (sin colores de artículos). */
export function SpanishText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="text-stone-100">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}

const ARROW = /\s*(?:->|→)\s*/;

/** Una frase de explicación en formato legible: las parejas «a -> b» se
 * convierten en fichas con flecha y las comillas simples resaltan el alemán. */
export function ExplainLine({ text }: { text: string }) {
  const parts = text.split(/[,;]\s+/);
  const pairs = parts.filter((p) => ARROW.test(p));
  if (pairs.length >= 2) {
    return (
      <div className="flex flex-wrap gap-2">
        {parts.map((part, i) => {
          if (!ARROW.test(part)) {
            return (
              <span key={i} className="self-center text-sm text-stone-400">
                {part}
              </span>
            );
          }
          const [from, to] = part.split(ARROW);
          return (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-700 bg-stone-900 px-3 py-1.5 text-base font-semibold"
            >
              <span className="text-stone-300">{from.replace(/'/g, "")}</span>
              <span className="text-sky-400">→</span>
              <span className="text-amber-300">{to.replace(/'/g, "")}</span>
            </span>
          );
        })}
      </div>
    );
  }
  return (
    <p>
      <GermanText text={text.replace(/'([^']+)'/g, "**$1**")} />
    </p>
  );
}

/** Divide un párrafo largo en frases independientes (sin lookbehind,
 * que iOS antiguo no soporta). */
export function splitSentences(body: string): string[] {
  return body
    .replace(/([.:])\s+(?=[A-ZÁÉÍÓÚÑ¿'])/g, "$1\n")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}
