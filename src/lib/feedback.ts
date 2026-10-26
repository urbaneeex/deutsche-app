/** Vibración corta en móviles que la soportan (Android). Silenciosa si no. */
export function haptic(kind: "ok" | "bad" | "tap" = "tap") {
  try {
    if (typeof navigator === "undefined" || !navigator.vibrate) return;
    navigator.vibrate(kind === "ok" ? 15 : kind === "bad" ? [40, 40, 40] : 8);
  } catch {
    /* ignorar */
  }
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
