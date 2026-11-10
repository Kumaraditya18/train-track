import { MemberPageHeader } from "@/components/ui/MemberPageHeader";
import { fetchSetLogsWithNames } from "@/lib/data/set-logs";
import { loadMemberToday } from "@/lib/dates/member-today";
import { previousIsoWeekKey } from "@/lib/dates/iso-week";
import { formatIsoWeekRangeIst } from "@/lib/dates/week-display";
import { requireProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { weeklyBestsFromLogs } from "@/lib/training/weekly-max";
import Link from "next/link";

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ history?: string }>;
}) {
  const { history } = await searchParams;
  const showFullHistory = history === "1" || history === "true";

  const [profile, today] = await Promise.all([requireProfile(), loadMemberToday()]);
  const supabase = await createClient();
  const currentWeek = today.weekKey;
  const lastWeek = previousIsoWeekKey(currentWeek);

  const { data: logs } = await fetchSetLogsWithNames(
    supabase,
    profile.id,
    currentWeek,
    showFullHistory ? "extended" : "two-weeks",
  );
  const bests = weeklyBestsFromLogs(logs);
  const thisWeek = bests.filter((b) => b.weekKey === currentWeek);
  const previousWeek = bests.filter((b) => b.weekKey === lastWeek);

  const byExercise = new Map<string, typeof bests>();
  if (showFullHistory) {
    for (const best of bests) {
      const list = byExercise.get(best.exerciseId) ?? [];
      list.push(best);
      byExercise.set(best.exerciseId, list);
    }
  }

  return (
    <div className="member-stack">
      <MemberPageHeader
        title="Progress"
        description={
          showFullHistory
            ? "Full history — heaviest set per exercise, by week (IST)."
            : "This week and last week only — tap below for full history."
        }
      />

      <section>
        <h2 className="type-section">This week</h2>
        <p className="type-body mt-1">{formatIsoWeekRangeIst(currentWeek)}</p>
        {thisWeek.length === 0 ? (
          <p className="type-caption mt-3">No sets logged for this week yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {thisWeek.map((row) => (
              <li
                key={row.exerciseId}
                className="surface flex justify-between gap-4 px-4 py-3 text-sm"
              >
                <span className="text-fg">{row.exerciseName}</span>
                <span className="tabular-nums font-semibold text-fg">
                  {row.topWeightKg} kg × {row.repsAtTopWeight}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="type-section">Last week</h2>
        <p className="type-body mt-1">{formatIsoWeekRangeIst(lastWeek)}</p>
        {previousWeek.length === 0 ? (
          <p className="type-caption mt-3">No sets logged last week.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {previousWeek.map((row) => (
              <li
                key={row.exerciseId}
                className="surface flex justify-between gap-4 px-4 py-3 text-sm"
              >
                <span className="text-fg">{row.exerciseName}</span>
                <span className="tabular-nums font-semibold text-fg">
                  {row.topWeightKg} kg × {row.repsAtTopWeight}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showFullHistory ? (
        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="type-section">All weeks</h2>
            <Link href="/progress" className="type-caption text-muted hover:text-fg">
              Back to 2-week view
            </Link>
          </div>
          <ul className="space-y-4">
            {[...byExercise.entries()].map(([exerciseId, weeks]) => (
              <li key={exerciseId} className="surface p-4">
                <p className="type-body-strong">{weeks[0]?.exerciseName}</p>
                <ul className="mt-3 space-y-1.5 text-sm text-muted">
                  {weeks
                    .sort((a, b) => b.weekKey.localeCompare(a.weekKey))
                    .map((w) => (
                      <li key={w.weekKey} className="flex justify-between gap-4 tabular-nums">
                        <span>{formatIsoWeekRangeIst(w.weekKey)}</span>
                        <span className="text-fg">
                          {w.topWeightKg} kg × {w.repsAtTopWeight}
                        </span>
                      </li>
                    ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <Link
          href="/progress?history=1"
          className="type-body-strong surface-sm block px-4 py-3 text-center text-soft"
        >
          Load full history
        </Link>
      )}
    </div>
  );
}
