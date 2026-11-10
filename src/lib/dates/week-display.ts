import { IST_TIMEZONE } from "@/lib/dates/ist";

const dayMonth = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST_TIMEZONE,
  day: "numeric",
  month: "short",
});

function ymdToDateUtc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function formatDayMonth(year: number, month: number, day: number): string {
  return dayMonth.format(ymdToDateUtc(year, month, day));
}

function addUtcDays(year: number, month: number, day: number, delta: number) {
  const d = ymdToDateUtc(year, month, day);
  d.setUTCDate(d.getUTCDate() + delta);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** Monday (UTC calendar date) for an internal `YYYY-Www` key — same key used in logs. */
export function isoWeekMondayYmd(key: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(key);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4, 12, 0, 0));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1 + (week - 1) * 7);
  return {
    year: monday.getUTCFullYear(),
    month: monday.getUTCMonth() + 1,
    day: monday.getUTCDate(),
  };
}

/** Human range for lifters, e.g. `Mon 10 – Sun 16 Nov` (IST). */
export function formatIsoWeekRangeIst(weekKey: string): string {
  const mon = isoWeekMondayYmd(weekKey);
  if (!mon) return weekKey;
  const sun = addUtcDays(mon.year, mon.month, mon.day, 6);

  const monLabel = formatDayMonth(mon.year, mon.month, mon.day);
  const sunLabel = formatDayMonth(sun.year, sun.month, sun.day);

  if (mon.month === sun.month && mon.year === sun.year) {
    const monDay = new Intl.DateTimeFormat("en-IN", {
      timeZone: IST_TIMEZONE,
      weekday: "short",
      day: "numeric",
    }).format(ymdToDateUtc(mon.year, mon.month, mon.day));
    const sunDay = new Intl.DateTimeFormat("en-IN", {
      timeZone: IST_TIMEZONE,
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(ymdToDateUtc(sun.year, sun.month, sun.day));
    return `${monDay} – ${sunDay}`;
  }

  return `${monLabel} – ${sunLabel}`;
}
