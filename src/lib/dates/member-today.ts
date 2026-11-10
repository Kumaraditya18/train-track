import { formatIstMemberDate, routineNamePrefixForSplitDay, splitDayIndex } from "@/lib/dates/ist";
import { isoWeekKey } from "@/lib/dates/iso-week";
import { formatIsoWeekRangeIst } from "@/lib/dates/week-display";
import type { Routine } from "@/lib/training/types";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

export type MemberToday = {
  weekKey: string;
  dateLine: string;
  splitDay: number | null;
  isRestDay: boolean;
  todaysRoutine: Routine | null;
};

export const loadMemberToday = cache(async (): Promise<MemberToday> => {
  const now = new Date();
  const splitDay = splitDayIndex(now);
  const weekKey = isoWeekKey(now);
  const dateLine = `${formatIstMemberDate(now)} · ${formatIsoWeekRangeIst(weekKey)}`;

  if (splitDay === null) {
    return {
      weekKey,
      dateLine,
      splitDay: null,
      isRestDay: true,
      todaysRoutine: null,
    };
  }

  const prefix = routineNamePrefixForSplitDay(splitDay);
  const supabase = await createClient();
  const { data } = await supabase
    .from("routines")
    .select("id, name, description, is_recommended_daily")
    .like("name", `${prefix}%`)
    .maybeSingle();

  return {
    weekKey,
    dateLine,
    splitDay,
    isRestDay: false,
    todaysRoutine: (data as Routine | null) ?? null,
  };
});
