"use client";

import { logSet } from "@/app/actions/workouts";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { useActionState } from "react";

export function SetLogForm({
  sessionId,
  exerciseId,
  nextSetIndex,
  pastTarget = false,
}: {
  sessionId: string;
  exerciseId: string;
  nextSetIndex: number;
  pastTarget?: boolean;
}) {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => logSet(sessionId, formData),
    {},
  );

  return (
    <form action={action} className="surface-sm mt-3 space-y-3 p-3">
      <input type="hidden" name="exercise_id" value={exerciseId} />
      <input type="hidden" name="set_index" value={nextSetIndex} />
      <p className="text-center text-xs font-semibold text-soft">
        {pastTarget ? `Bonus set ${nextSetIndex}` : `Log set ${nextSetIndex}`}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0">
          <Label htmlFor={`w-${exerciseId}-${nextSetIndex}`}>kg</Label>
          <Input
            id={`w-${exerciseId}-${nextSetIndex}`}
            name="weight_kg"
            inputMode="decimal"
            step="0.5"
            required
            placeholder="0"
            className="text-lg font-semibold tabular-nums"
          />
        </div>
        <div className="min-w-0">
          <Label htmlFor={`r-${exerciseId}-${nextSetIndex}`}>Reps</Label>
          <Input
            id={`r-${exerciseId}-${nextSetIndex}`}
            name="reps"
            inputMode="numeric"
            required
            placeholder="0"
            className="text-lg font-semibold tabular-nums"
          />
        </div>
      </div>
      <Button type="submit" className="w-full py-3 text-base" disabled={pending}>
        {pending ? "Saving…" : "Save set"}
      </Button>
      {state.error ? <p className="text-center text-sm text-danger">{state.error}</p> : null}
    </form>
  );
}
