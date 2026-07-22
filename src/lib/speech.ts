export type SpeakResult = { ok: true } | { ok: false; reason: string };

const NO_SUPPORT: SpeakResult = {
  ok: false,
  reason: "Este navegador no admite lectura en voz alta.",
};
const NO_VOICE: SpeakResult = {
  ok: false,
  reason:
    "Tu dispositivo no tiene voz en alemán instalada. Revisa Ajustes → Accesibilidad → Texto a voz y descarga el idioma alemán.",
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
  // render: se cargan de forma asíncrona. Las precargamos cuanto antes y
  // nos suscribimos a los cambios para tenerlas listas al primer toque.
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
 * iOS Safari (y algunos Android antiguos) necesitan que el motor de voz
 * reciba un primer speak() dentro de un gesto real del usuario para
 * "despertarse"; sin este calentamiento previo, la primera frase real
 * puede perderse en silencio aunque las siguientes sí suenen.
 */
function primeSynthOnce(synth: SpeechSynthesis) {
  if (primed) return;
  primed = true;
  try {
    const warmup = new SpeechSynthesisUtterance(" ");
    warmup.volume = 0;
    synth.speak(warmup);
  } catch {
    // Best effort: si falla, el intento real seguirá su curso normal.
  }
}

function waitForVoices(timeoutMs: number): Promise<void> {
  if (cachedVoices.length || !hasSpeechSynthesis()) return Promise.resolve();
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const timer = setTimeout(() => {
      synth.removeEventListener("voiceschanged", onChange);
      resolve();
    }, timeoutMs);
    function onChange() {
      refreshVoices();
      if (cachedVoices.length) {
        clearTimeout(timer);
        synth.removeEventListener("voiceschanged", onChange);
        resolve();
      }
    }
    synth.addEventListener("voiceschanged", onChange);
  });
}

/**
 * Reproduce un texto en alemán con la Web Speech API y devuelve si el
 * intento tuvo éxito. En vez de fallar en silencio (el problema típico en
 * móvil: no pasa nada al tocar "Escuchar" y no hay forma de saber por qué),
 * resuelve con el motivo del fallo para poder mostrarlo en la interfaz.
 */
export function speakGerman(text: string): Promise<SpeakResult> {
  if (!hasSpeechSynthesis()) return Promise.resolve(NO_SUPPORT);
  const synth = window.speechSynthesis;
  primeSynthOnce(synth);

  return waitForVoices(300).then(() => {
    refreshVoices();
    if (!cachedVoices.length) return NO_VOICE;

    return new Promise<SpeakResult>((resolve) => {
      let settled = false;
      const finish = (result: SpeakResult) => {
        if (settled) return;
        settled = true;
        stopResumeWatchdog();
        resolve(result);
      };

      const runSpeak = () => {
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
          synth.speak(utterance);
        } catch {
          finish(SILENT_FAIL);
          return;
        }

        // Chrome (escritorio y Android) pausa utterances de más de ~15s si
        // la pestaña pierde foco o el dispositivo bloquea pantalla, y nunca
        // las reanuda solo. Este watchdog las reactiva mientras hable.
        stopResumeWatchdog();
        resumeWatchdog = setInterval(() => {
          if (!synth.speaking) {
            stopResumeWatchdog();
            return;
          }
          if (synth.paused) synth.resume();
        }, 4000);

        // Bug conocido de Chrome/Android: a veces speak() no arranca ni
        // dispara error, simplemente no hace nada. Si tras 2s no ha
        // empezado, lo tratamos como fallo silencioso para poder avisar.
        setTimeout(() => {
          if (!settled && !synth.speaking && !synth.pending) finish(SILENT_FAIL);
        }, 2000);
      };

      // Cancelar y hablar en el mismo tick hace que Chrome/Android descarte
      // la nueva frase en silencio. Solo forzamos ese pequeño respiro
      // cuando de verdad había algo sonando.
      if (synth.speaking || synth.pending) {
        synth.cancel();
        setTimeout(runSpeak, 60);
      } else {
        runSpeak();
      }
    });
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
