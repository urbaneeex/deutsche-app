/** Fecha local (YYYY-MM-DD). Con toISOString() el "día" cambiaba a las
 * 1-2 de la madrugada en España y rompía la racha. */
export function todayStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function daysBetween(a: string, b: string): number {
  const dateA = new Date(a + "T00:00:00Z").getTime();
  const dateB = new Date(b + "T00:00:00Z").getTime();
  return Math.round((dateB - dateA) / (24 * 60 * 60 * 1000));
}
