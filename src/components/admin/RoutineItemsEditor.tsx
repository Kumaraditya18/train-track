"use client";

import { saveRoutineItems } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import type { Exercise } from "@/lib/training/types";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";

const LONG_PRESS_MS = 420;

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
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [pressingIndex, setPressingIndex] = useState<number | null>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragActiveRef = useRef(false);

  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);

  function clearLongPress() {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    setPressingIndex(null);
  }

  function renumber(next: EditableItem[]) {
    return next.map((item, i) => ({ ...item, sort_order: i + 1 }));
  }

  function moveItem(from: number, to: number) {
    if (from === to) return;
    setItems((prev) => {
      const next = [...prev];
      const [removed] = next.splice(from, 1);
      next.splice(to, 0, removed);
      return renumber(next);
    });
  }

  function startDrag(index: number, pointerId: number, target: EventTarget | null) {
    dragActiveRef.current = true;
    setDragIndex(index);
    setOverIndex(index);
    if (target instanceof HTMLElement) target.setPointerCapture(pointerId);
  }

  function onHandlePointerDown(index: number, e: PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0) return;
    e.preventDefault();
    if (e.pointerType === "mouse") {
      startDrag(index, e.pointerId, e.currentTarget);
      return;
    }
    setPressingIndex(index);
    longPressRef.current = setTimeout(() => {
      longPressRef.current = null;
      startDrag(index, e.pointerId, e.currentTarget);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(12);
      }
    }, LONG_PRESS_MS);
  }

  function onHandlePointerMove(_index: number, e: PointerEvent<HTMLButtonElement>) {
    if (longPressRef.current && !dragActiveRef.current) {
      const moved = Math.hypot(e.movementX, e.movementY);
      if (moved > 6) clearLongPress();
    }
  }

  useEffect(() => {
    if (dragIndex === null) return;
    function onDocPointerMove(e: globalThis.PointerEvent) {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const row = target?.closest("[data-routine-item-index]");
      if (!row) return;
      const idx = Number(row.getAttribute("data-routine-item-index"));
      if (Number.isFinite(idx)) setOverIndex(idx);
    }
    window.addEventListener("pointermove", onDocPointerMove);
    return () => window.removeEventListener("pointermove", onDocPointerMove);
  }, [dragIndex]);

  function onHandlePointerUp(e: PointerEvent<HTMLButtonElement>) {
    clearLongPress();
    if (dragActiveRef.current) {
      if (dragIndex !== null && overIndex !== null) moveItem(dragIndex, overIndex);
      dragActiveRef.current = false;
      setDragIndex(null);
      setOverIndex(null);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    }
  }

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
    setItems((prev) => renumber(prev.filter((_, i) => i !== index)));
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

      {items.length > 1 ? (
        <p className="type-caption text-muted">
          Drag the handle to reorder. On phone, long-press the handle, then drag.
        </p>
      ) : null}

      <ul className="space-y-3">
        {items.map((item, index) => {
          const exercise = exerciseById.get(item.exercise_id);
          const isDragging = dragIndex === index;
          const isDropTarget = overIndex === index && dragIndex !== null && dragIndex !== index;
          return (
            <li
              key={item.exercise_id}
              data-routine-item-index={index}
              className={`panel p-4 transition-[opacity,box-shadow] duration-[var(--m-out)] ${
                isDragging ? "opacity-60" : ""
              } ${isDropTarget ? "ring-2 ring-accent/40" : ""}`}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Reorder ${exercise?.name ?? "exercise"}`}
                  className={`flex h-10 w-9 shrink-0 touch-none flex-col items-center justify-center gap-1 rounded-lg border border-line bg-elevated text-muted ${
                    pressingIndex === index ? "ring-2 ring-accent/35" : ""
                  }`}
                  onPointerDown={(e) => onHandlePointerDown(index, e)}
                  onPointerMove={(e) => onHandlePointerMove(index, e)}
                  onPointerUp={onHandlePointerUp}
                  onPointerCancel={onHandlePointerUp}
                >
                  <span className="block h-0.5 w-4 rounded-full bg-current opacity-50" />
                  <span className="block h-0.5 w-4 rounded-full bg-current opacity-50" />
                  <span className="block h-0.5 w-4 rounded-full bg-current opacity-50" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-fg">
                      <span className="text-muted tabular-nums">{index + 1}. </span>
                      {exercise?.name ?? "Exercise"}
                    </p>
                    <button
                      type="button"
                      className="shrink-0 text-xs text-danger transition-colors duration-[var(--m-out)] hover:text-danger/80"
                      onClick={() => removeItem(index)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 pl-11 text-sm">
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
