import { upsertRoutine } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { Input, Label, TextArea } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/server";
import type { Routine } from "@/lib/training/types";
import Link from "next/link";

export default async function AdminRoutinesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("routines")
    .select("id, name, description, is_recommended_daily")
    .order("name");
  const routines = (data as Routine[]) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">Routines</h1>
        <p className="mt-1 text-sm text-muted">Only one routine should be marked as the daily recommendation.</p>
      </div>

      <form action={upsertRoutine} className="panel space-y-4 p-5">
        <h2 className="font-semibold text-fg">New routine</h2>
        <div>
          <Label htmlFor="routine-name">Name</Label>
          <Input id="routine-name" name="name" required />
        </div>
        <div>
          <Label htmlFor="routine-desc">Description</Label>
          <TextArea id="routine-desc" name="description" rows={2} />
        </div>
        <label className="flex items-center gap-2 text-sm text-soft">
          <input type="checkbox" name="is_recommended_daily" className="rounded border-line-strong accent-accent" />
          Daily recommendation
        </label>
        <Button type="submit">Create</Button>
      </form>

      <ul className="space-y-3">
        {routines.map((routine) => (
          <li key={routine.id} className="panel panel-interactive p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-fg">{routine.name}</p>
                {routine.description ? (
                  <p className="text-sm text-muted">{routine.description}</p>
                ) : null}
                {routine.is_recommended_daily ? (
                  <p className="mt-1 text-xs font-medium text-accent">Daily pick</p>
                ) : null}
              </div>
              <Link href={`/admin/routines/${routine.id}`} className="link-accent shrink-0 text-sm font-medium">
                Edit items →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
