/** Calendar math for Kumar's timezone (Asia/Kolkata). */

export const IST_TIMEZONE = "Asia/Kolkata";

const weekdayShort = new Intl.DateTimeFormat("en-US", {
  timeZone: IST_TIMEZONE,
  weekday: "short",
});

const dateLong = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST_TIMEZONE,
  weekday: "long",
  day: "numeric",
  month: "short",
});

const ymdParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: IST_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Mon–Sat → 1–6; Sunday → null (rest). */
const SPLIT_BY_WEEKDAY: Record<string, number | null> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: null,
};

export function istYmd(date: Date = new Date()): { year: number; month: number; day: number } {
  const parts = ymdParts.formatToParts(date);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return { year, month, day };
}

export function splitDayIndex(date: Date = new Date()): number | null {
  const short = weekdayShort.format(date);
  return SPLIT_BY_WEEKDAY[short] ?? null;
}

export function routineNamePrefixForSplitDay(dayIndex: number): string {
  return `Day ${dayIndex} —`;
}

export function formatIstMemberDate(date: Date = new Date()): string {
  return dateLong.format(date);
}
