import { MemberPageHeader } from "@/components/ui/MemberPageHeader";
import { loadMemberToday } from "@/lib/dates/member-today";
import { formatIsoWeekRangeIst } from "@/lib/dates/week-display";
import { requireProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { weeklyBestsFromLogs } from "@/lib/training/weekly-max";
import type { SetLog } from "@/lib/training/types";

export default async function ProgressPage() {
  const profile = await requireProfile();
  const today = await loadMemberToday();
  const supabase = await createClient();
  const currentWeek = today.weekKey;
  const thisWeekLabel = formatIsoWeekRangeIst(currentWeek);

  const { data: rows } = await supabase
    .from("set_logs")
    .select("id, session_id, user_id, exercise_id, set_index, weight_kg, reps, logged_at, exercises(name)")
    .eq("user_id", profile.id)
    .order("logged_at", { ascending: false })
    .limit(800);

  const logs = (rows ?? []).map((row) => {
    const join = row.exercises as { name: string } | { name: string }[] | null;
    const name = Array.isArray(join) ? join[0]?.name : join?.name;
    return { ...(row as SetLog), exercise_name: name ?? "Exercise" };
  });

  const bests = weeklyBestsFromLogs(logs);
  const thisWeek = bests.filter((b) => b.weekKey === currentWeek);

  const byExercise = new Map<string, typeof bests>();
  for (const best of bests) {
    const list = byExercise.get(best.exerciseId) ?? [];
    list.push(best);
    byExercise.set(best.exerciseId, list);
  }

  return (
    <div className="member-stack">
      <MemberPageHeader
        title="Progress"
        description="Heaviest set per exercise, grouped by week (Mon–Sun IST)."
      />

      <section>
        <h2 className="type-section">This week</h2>
        <p className="type-body mt-1">{thisWeekLabel}</p>
        {thisWeek.length === 0 ? (
          <p className="mt-3 text-sm text-faint">No sets logged for this week yet.</p>
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
        <h2 className="type-section">History</h2>
        <ul className="mt-4 space-y-4">
          {[...byExercise.entries()].map(([exerciseId, weeks]) => (
            <li key={exerciseId} className="surface p-4">
              <p className="font-medium text-fg">{weeks[0]?.exerciseName}</p>
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
    </div>
  );
}
