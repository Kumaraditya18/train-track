import { istYmd } from "@/lib/dates/ist";

/** ISO week `YYYY-Www` from calendar year/month/day (Monday-based week). */
export function isoWeekKeyFromYmd(year: number, month: number, day: number): string {
  const d = new Date(Date.UTC(year, month - 1, day));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Current ISO week in IST. */
export function isoWeekKey(date: Date = new Date()): string {
  const { year, month, day } = istYmd(date);
  return isoWeekKeyFromYmd(year, month, day);
}

export function isoWeekKeyFromIso(iso: string): string {
  return isoWeekKey(new Date(iso));
}

export function previousIsoWeekKey(key: string): string {
  const match = /^(\d{4})-W(\d{2})$/.exec(key);
  if (!match) return key;
  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1 + (week - 1) * 7 - 7);
  return isoWeekKey(monday);
}
