export type SpeakResult = { ok: true } | { ok: false; reason: string };

const NO_SUPPORT: SpeakResult = {
  ok: false,
  reason: "Este navegador no admite lectura en voz alta.",
};
const SILENT_FAIL: SpeakResult = {
  ok: false,
  reason: "No se pudo reproducir el audio en este dispositivo. Inténtalo de nuevo.",
};

let cachedVoices: SpeechSynthesisVoice[] = [];
// Referencia viva fuera de la función: en iOS Safari, si el objeto
// SpeechSynthesisUtterance queda sin ninguna referencia externa el motor
// puede recolectarlo como basura a mitad de la frase y esta se corta en
// silencio. Guardarlo en una variable de módulo evita ese bug.
let activeUtterance: SpeechSynthesisUtterance | null = null;
let resumeWatchdog: ReturnType<typeof setInterval> | null = null;
let primed = false;

function hasSpeechSynthesis(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function refreshVoices() {
  if (!hasSpeechSynthesis()) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) cachedVoices = voices;
}

if (hasSpeechSynthesis()) {
  // En móvil (sobre todo Android) las voces no están listas en el primer
  // render: se cargan de forma asíncrona. Las precargamos en segundo plano
  // para tenerlas disponibles cuanto antes, pero esto nunca debe bloquear
  // la llamada real a speak() (ver comentario en speakGerman).
  refreshVoices();
  window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
}

function pickGermanVoice(): SpeechSynthesisVoice | null {
  refreshVoices();
  return (
    cachedVoices.find((v) => v.lang.toLowerCase() === "de-de") ??
    cachedVoices.find((v) => v.lang.toLowerCase().startsWith("de")) ??
    null
  );
}

function stopResumeWatchdog() {
  if (resumeWatchdog !== null) {
    clearInterval(resumeWatchdog);
    resumeWatchdog = null;
  }
}

/**
 * Reproduce un texto en alemán con la Web Speech API y devuelve si el
 * intento tuvo éxito.
 *
 * CRÍTICO para móvil: iOS Safari y Chrome/Android solo reproducen audio si
 * speechSynthesis.speak() se llama de forma SÍNCRONA dentro del gesto de
 * usuario (el propio onClick). Cualquier await/.then()/setTimeout antes de
 * esa llamada hace que el navegador la descarte en silencio, sin error.
 * Por eso aquí no se espera nada antes de hablar: todo lo síncrono ocurre
 * ya dentro del executor de la Promise (que corre en el mismo tick), y los
 * timers solo se usan después, para vigilar/diagnosticar el intento.
 */
export function speakGerman(text: string): Promise<SpeakResult> {
  if (!hasSpeechSynthesis()) return Promise.resolve(NO_SUPPORT);
  const synth = window.speechSynthesis;

  return new Promise<SpeakResult>((resolve) => {
    let settled = false;
    const finish = (result: SpeakResult) => {
      if (settled) return;
      settled = true;
      stopResumeWatchdog();
      resolve(result);
    };

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    utterance.rate = 0.95;
    utterance.volume = 1;
    utterance.pitch = 1;
    const germanVoice = pickGermanVoice();
    if (germanVoice) utterance.voice = germanVoice;

    utterance.onstart = () => finish({ ok: true });
    utterance.onend = () => {
      finish({ ok: true });
      if (activeUtterance === utterance) activeUtterance = null;
    };
    utterance.onerror = () => {
      finish(SILENT_FAIL);
      if (activeUtterance === utterance) activeUtterance = null;
    };

    activeUtterance = utterance;
    try {
      // cancel() interrumpe lo que estuviera sonando; va en la misma
      // llamada síncrona porque cualquier retraso aquí ya rompería el
      // gesto de usuario que exige móvil.
      synth.cancel();
      if (!primed) {
        // Primer uso en esta sesión: iOS Safari suele "tragarse" la
        // primera frase real aunque todo se llame correctamente. Encolar
        // una utterance muda justo antes (mismo tick) despierta el motor.
        primed = true;
        const warmup = new SpeechSynthesisUtterance(" ");
        warmup.volume = 0;
        synth.speak(warmup);
      }
      synth.speak(utterance);
    } catch {
      finish(SILENT_FAIL);
      return;
    }

    // Chrome (escritorio y Android) pausa utterances de más de ~15s si la
    // pestaña pierde foco o el dispositivo bloquea pantalla, y nunca las
    // reanuda solo. Este watchdog las reactiva mientras dure la frase.
    resumeWatchdog = setInterval(() => {
      if (!synth.speaking) {
        stopResumeWatchdog();
        return;
      }
      if (synth.paused) synth.resume();
    }, 4000);

    // Algunos móviles no disparan ni onstart ni onerror si el motor
    // rechaza la reproducción; sin este aviso el botón se quedaría
    // "pensando" para siempre.
    setTimeout(() => {
      if (!settled && !synth.speaking && !synth.pending) finish(SILENT_FAIL);
    }, 2500);
  });
}

export function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?¡¿"']/g, "")
    .replace(/ß/g, "ss")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/\s+/g, " ")
    .trim();
}

/** Distancia de Levenshtein, para dar un porcentaje de acierto aproximado. */
function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

export function similarityScore(target: string, spoken: string): number {
  const a = normalizeForComparison(target);
  const b = normalizeForComparison(spoken);
  if (!a.length && !b.length) return 1;
  const dist = levenshtein(a, b);
  return Math.max(0, 1 - dist / Math.max(a.length, b.length, 1));
}
