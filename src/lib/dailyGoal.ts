import { todayStr } from "@/lib/date";

/** XP del día guardado en el dispositivo (sin migración de base de datos). */
export const DAILY_GOAL_XP = 50;
export const XP_PER_CORRECT = 5;

const key = (userId: string) => `xp:${userId}`;

type Stored = { date: string; xp: number; total: number };

function read(userId: string): Stored {
  try {
    const raw = localStorage.getItem(key(userId));
    if (raw) {
      const parsed = JSON.parse(raw) as Stored;
      return parsed.date === todayStr()
        ? parsed
        : { date: todayStr(), xp: 0, total: parsed.total ?? 0 };
    }
  } catch {
    /* ignorar */
  }
  return { date: todayStr(), xp: 0, total: 0 };
}

export function getXp(userId: string) {
  return read(userId);
}

export function addXp(userId: string, amount: number) {
  const current = read(userId);
  const next = { ...current, xp: current.xp + amount, total: current.total + amount };
  try {
    localStorage.setItem(key(userId), JSON.stringify(next));
  } catch {
    /* ignorar */
  }
  return next;
}
