"use client";

import { saveRoutineItems } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import type { Exercise } from "@/lib/training/types";
import { useMemo, useState } from "react";

type EditableItem = {
  exercise_id: string;
  sort_order: number;
  target_sets: number;
  rep_floor: number;
  rep_ceiling: number;
};

const selectClass =
  "flex-1 rounded-xl border border-line-strong bg-elevated px-3.5 py-2.5 text-sm text-fg outline-none transition-[border-color] duration-[var(--m-out)] [transition-timing-function:var(--m-ease)] focus:border-accent focus:ring-2 focus:ring-accent/25";

export function RoutineItemsEditor({
  routineId,
  exercises,
  initialItems,
}: {
  routineId: string;
  exercises: Exercise[];
  initialItems: EditableItem[];
}) {
  const [items, setItems] = useState<EditableItem[]>(() =>
    initialItems.map((item) => ({
      ...item,
      rep_ceiling: item.rep_ceiling ?? 12,
    })),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);

  function addExercise(exerciseId: string) {
    if (!exerciseId || items.some((i) => i.exercise_id === exerciseId)) return;
    setItems((prev) => [
      ...prev,
      {
        exercise_id: exerciseId,
        sort_order: prev.length + 1,
        target_sets: 3,
        rep_floor: 8,
        rep_ceiling: 12,
      },
    ]);
  }

  function updateItem(index: number, patch: Partial<EditableItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeItem(index: number) {
    setItems((prev) =>
      prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, sort_order: i + 1 })),
    );
  }

  async function onSave() {
    setPending(true);
    setError(null);
    setMessage(null);
    const formData = new FormData();
    formData.set("items_json", JSON.stringify(items));
    const result = await saveRoutineItems(routineId, formData);
    setPending(false);
    if (result.error) setError(result.error);
    else setMessage("Routine saved.");
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select
          className={selectClass}
          defaultValue=""
          onChange={(e) => {
            addExercise(e.target.value);
            e.target.value = "";
          }}
        >
          <option value="">Add exercise…</option>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
        <Button type="button" onClick={onSave} disabled={pending}>
          Save items
        </Button>
      </div>

      <ul className="space-y-3">
        {items.map((item, index) => {
          const exercise = exerciseById.get(item.exercise_id);
          return (
            <li key={`${item.exercise_id}-${index}`} className="panel p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-fg">{exercise?.name ?? "Exercise"}</p>
                <button
                  type="button"
                  className="text-xs text-danger transition-colors duration-[var(--m-out)] hover:text-danger/80"
                  onClick={() => removeItem(index)}
                >
                  Remove
                </button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <Label htmlFor={`sets-${index}`}>Sets</Label>
                  <Input
                    id={`sets-${index}`}
                    type="number"
                    min={1}
                    value={item.target_sets}
                    onChange={(e) => updateItem(index, { target_sets: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor={`reps-min-${index}`}>Rep floor (min)</Label>
                  <Input
                    id={`reps-min-${index}`}
                    type="number"
                    min={1}
                    value={item.rep_floor}
                    onChange={(e) => updateItem(index, { rep_floor: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor={`reps-max-${index}`}>Rep ceiling (max)</Label>
                  <Input
                    id={`reps-max-${index}`}
                    type="number"
                    min={1}
                    value={item.rep_ceiling ?? 12}
                    onChange={(e) => updateItem(index, { rep_ceiling: Number(e.target.value) })}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {message ? <p className="text-sm font-medium text-accent">{message}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
