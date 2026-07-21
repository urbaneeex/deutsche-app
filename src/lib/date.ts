export function todayStr(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  const dateA = new Date(a + "T00:00:00Z").getTime();
  const dateB = new Date(b + "T00:00:00Z").getTime();
  return Math.round((dateB - dateA) / (24 * 60 * 60 * 1000));
}
