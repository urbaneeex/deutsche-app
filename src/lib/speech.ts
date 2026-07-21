let cachedVoices: SpeechSynthesisVoice[] = [];
// Referencia viva fuera de la función: en iOS Safari, si el objeto
// SpeechSynthesisUtterance queda sin ninguna referencia externa el motor
// puede recolectarlo como basura a mitad de la frase y esta se corta en
// silencio. Guardarlo en una variable de módulo evita ese bug.
let activeUtterance: SpeechSynthesisUtterance | null = null;
let resumeWatchdog: ReturnType<typeof setInterval> | null = null;

function refreshVoices() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) cachedVoices = voices;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
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

export function speakGerman(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;

  const runSpeak = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    utterance.rate = 0.95;
    const germanVoice = pickGermanVoice();
    if (germanVoice) utterance.voice = germanVoice;

    utterance.onend = () => {
      stopResumeWatchdog();
      if (activeUtterance === utterance) activeUtterance = null;
    };
    utterance.onerror = () => {
      stopResumeWatchdog();
      if (activeUtterance === utterance) activeUtterance = null;
    };

    activeUtterance = utterance;
    synth.speak(utterance);

    // Chrome (escritorio y Android) pausa utterances de más de ~15s si la
    // pestaña pierde foco o el dispositivo bloquea pantalla, y nunca las
    // reanuda solo. Este watchdog las reactiva mientras dure la frase.
    stopResumeWatchdog();
    resumeWatchdog = setInterval(() => {
      if (!synth.speaking) {
        stopResumeWatchdog();
        return;
      }
      if (synth.paused) synth.resume();
    }, 4000);
  };

  // Cancelar y hablar en el mismo tick hace que Chrome/Android descarte la
  // nueva frase en silencio. Solo forzamos ese pequeño respiro cuando de
  // verdad había algo sonando; si no, hablamos al instante (necesario para
  // que iOS Safari reconozca el toque del usuario como gesto válido).
  if (synth.speaking || synth.pending) {
    synth.cancel();
    setTimeout(runSpeak, 60);
  } else {
    runSpeak();
  }
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
