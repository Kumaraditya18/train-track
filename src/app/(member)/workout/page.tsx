import { startWorkout } from "@/app/actions/workouts";
import { Button } from "@/components/ui/Button";
import { MemberPageHeader } from "@/components/ui/MemberPageHeader";
import { Input, Label } from "@/components/ui/Field";
import { loadMemberToday } from "@/lib/dates/member-today";
import { requireProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import type { Routine } from "@/lib/training/types";

function sortSplitRoutines(a: Routine, b: Routine): number {
  const dayA = /^Day (\d+)/.exec(a.name)?.[1];
  const dayB = /^Day (\d+)/.exec(b.name)?.[1];
  if (dayA && dayB) return Number(dayA) - Number(dayB);
  return a.name.localeCompare(b.name);
}

export default async function WorkoutPickerPage() {
  await requireProfile();
  const today = await loadMemberToday();
  const supabase = await createClient();
  const { data: routines } = await supabase
    .from("routines")
    .select("id, name, description, is_recommended_daily")
    .order("name");

  const list = ((routines as Routine[]) ?? []).slice().sort(sortSplitRoutines);
  const todayId = today.todaysRoutine?.id;

  return (
    <div className="member-stack">
      <MemberPageHeader title="Train" description={today.dateLine} />

      <section className="space-y-2">
        {list.length === 0 ? (
          <p className="text-sm text-faint">No routines yet.</p>
        ) : (
          list.map((routine) => {
            const isToday = routine.id === todayId;
            return (
              <form key={routine.id} action={startWorkout} className="block">
                <input type="hidden" name="routine_id" value={routine.id} />
                <button
                  type="submit"
                  className={`panel-interactive surface flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left ${
                    isToday ? "ring-1 ring-fg/12" : ""
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-fg">{routine.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {isToday
                        ? "Scheduled for today (IST)"
                        : (routine.description ?? "Routine")}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-medium text-soft">Start</span>
                </button>
              </form>
            );
          })
        )}
      </section>

      <section className="surface rounded-2xl p-4">
        <h2 className="type-section">Custom session</h2>
        <form action={startWorkout} className="mt-3 space-y-3">
          <div>
            <Label htmlFor="custom-title">Name</Label>
            <Input id="custom-title" name="title" placeholder="Push day" required />
          </div>
          <Button type="submit" variant="secondary" className="w-full">
            Start empty workout
          </Button>
        </form>
      </section>
    </div>
  );
}
