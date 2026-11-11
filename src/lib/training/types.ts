export type MemberRole = "member" | "admin";

export type Profile = {
  id: string;
  display_name: string;
  role: MemberRole;
};

export type Exercise = {
  id: string;
  name: string;
  muscle_group: string | null;
  instructions: string | null;
  video_url?: string | null;
  video_source?: string | null;
  video_attribution?: string | null;
  focus_muscles?: string[] | null;
};

export type Routine = {
  id: string;
  name: string;
  description: string | null;
  is_recommended_daily: boolean;
};

export type RoutineItem = {
  id: string;
  routine_id: string;
  exercise_id: string;
  sort_order: number;
  target_sets: number;
  rep_floor: number;
  rep_ceiling: number;
  exercise?: Exercise;
};

export type WorkoutSession = {
  id: string;
  user_id: string;
  routine_id: string | null;
  title: string;
  started_at: string;
  finished_at: string | null;
};

export type SetLog = {
  id: string;
  session_id: string;
  user_id: string;
  exercise_id: string;
  set_index: number;
  weight_kg: number;
  reps: number;
  logged_at: string;
};

export type WeeklyBest = {
  exerciseId: string;
  exerciseName: string;
  weekKey: string;
  topWeightKg: number;
  repsAtTopWeight: number;
};

export type OverloadHint = {
  exerciseId: string;
  exerciseName: string;
  lastWeek: WeeklyBest | null;
  thisWeek: WeeklyBest | null;
  repFloor: number;
  repCeiling: number;
  suggestion: string;
};
