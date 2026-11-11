import { upsertRoutine } from "@/app/actions/admin";
import { RoutineItemsEditor } from "@/components/admin/RoutineItemsEditor";
import { Button } from "@/components/ui/Button";
import { Input, Label, TextArea } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/server";
import type { Exercise, Routine } from "@/lib/training/types";
import { notFound } from "next/navigation";

export default async function AdminRoutineDetailPage({
  params,
}: {
  params: Promise<{ routineId: string }>;
}) {
  const { routineId } = await params;
  const supabase = await createClient();

  const [{ data: routine }, { data: exercises }, { data: items }] = await Promise.all([
    supabase.from("routines").select("id, name, description, is_recommended_daily").eq("id", routineId).maybeSingle(),
    supabase.from("exercises").select("id, name, muscle_group").order("name"),
    supabase
      .from("routine_items")
      .select("exercise_id, sort_order, target_sets, rep_floor, rep_ceiling")
      .eq("routine_id", routineId)
      .order("sort_order"),
  ]);

  if (!routine) notFound();

  return (
    <div className="space-y-8">
      <form action={upsertRoutine} className="panel space-y-4 p-5">
        <input type="hidden" name="id" value={routineId} />
        <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">Edit routine</h1>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={(routine as Routine).name} required />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <TextArea id="description" name="description" rows={2} defaultValue={(routine as Routine).description ?? ""} />
        </div>
        <label className="flex items-center gap-2 text-sm text-soft">
          <input
            type="checkbox"
            name="is_recommended_daily"
            className="rounded border-line-strong accent-accent"
            defaultChecked={(routine as Routine).is_recommended_daily}
          />
          Daily recommendation
        </label>
        <Button type="submit">Save details</Button>
      </form>

      <section>
        <h2 className="mb-3 font-semibold text-fg">Exercises in this routine</h2>
        <RoutineItemsEditor
          routineId={routineId}
          exercises={(exercises as Exercise[]) ?? []}
          initialItems={
            (items as {
              exercise_id: string;
              sort_order: number;
              target_sets: number;
              rep_floor: number;
              rep_ceiling: number;
            }[]) ?? []
          }
        />
      </section>
    </div>
  );
}
