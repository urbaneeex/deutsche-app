import { A1_SLIDES } from "./a1";
import { A2_SLIDES } from "./a2";

/**
 * Explicaciones "de una idea por pantalla" para las lecciones A1-A2.
 * Reglas de redacción (pensadas para atención corta / TDAH):
 *  - máx. ~25 palabras por pantalla, una sola idea
 *  - siempre ejemplo con audio justo después de la regla
 *  - una micro-pregunta (quick) cada 2-3 pantallas: recordar > releer
 *  - **negrita** = la parte clave en el alemán
 */
export type Ex = { de: string; es: string };

export type Slide =
  | { t: "hook"; emoji: string; title: string; text: string }
  | { t: "rule"; title: string; text: string; ex?: Ex[] }
  | { t: "table"; title: string; note?: string; say?: "left" | "both" | "none"; rows: [string, string, string?][] }
  | { t: "versus"; title: string; a: Ex; b: Ex; aLabel?: string; bLabel?: string; why: string }
  | { t: "grid"; title: string; note?: string; cols: string[]; rows: string[][] }
  | { t: "points"; title: string; items: string[] }
  | { t: "tip"; emoji: string; text: string }
  | { t: "quick"; q: string; choices: string[]; a: string; why?: string };

export const SLIDES: Record<string, Slide[]> = { ...A1_SLIDES, ...A2_SLIDES };

/** Lección de gramática (/lessons) -> paso de la ruta con sus tarjetas visuales. */
export const LESSON_TO_STEP: Record<string, string> = {
  "pronombres-personales-posesivos": "paso-a1-1-pronombres",
  "presente-verbos-regulares": "paso-a1-2-presente-regular",
  "verbos-irregulares-comunes": "paso-a1-3-sein-haben",
  "nominativ-akkusativ": "paso-a1-4-akkusativ",
  "du-vs-sie": "paso-a1-7-du-vs-sie",
  "articulos-genero": "paso-a1-8-articulos-genero",
  "modalverben-basicos": "paso-a1-9-modalverben",
  "negacion-nicht-kein": "paso-a1-10-negacion",
  "w-fragen": "paso-a1-11-w-fragen",
  "plural-sustantivos": "paso-a1-12-plural",
  "imperativ-basico": "paso-a1-13-imperativ",
  "perfekt-intro": "paso-a1-14-perfekt-intro",
  dativ: "paso-a2-1-dativ",
  "excepciones-y-trampas": "paso-a2-2-excepciones",
  "perfekt-completo": "paso-a2-3-perfekt-completo",
  "praeteritum-sein-haben-modal": "paso-a2-4-praeteritum-basico",
  "adjektivdeklination-intro": "paso-a2-5-adjektivdeklination",
  "komparativ-superlativ": "paso-a2-6-komparativ-superlativ",
  wechselpraepositionen: "paso-a2-7-wechselpraepositionen",
  "nebensaetze-weil-dass-wenn": "paso-a2-8-nebensaetze",
  "possessivartikel-dativ-akkusativ": "paso-a2-9-possessivartikel",
  "reflexive-verben": "paso-a2-10-reflexive-verben",
};
