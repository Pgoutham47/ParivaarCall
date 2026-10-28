import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { Frequency, MealTiming, MedicineSchedule, MedicineScheduleInput } from "@/lib/types";
import { validateMedicine } from "@/lib/validation";
import { scheduleIsDue } from "@/lib/schedule-rules";
import { localDateKey } from "@/lib/services/timezone";
import { getCurrentUserId } from "@/lib/services/auth";

type MedicineRow = Database["public"]["Tables"]["medicine_schedules"]["Row"];
type MedicineWithParentRow = MedicineRow & {
  parents?: { name: string | null } | null;
};

function normalizeTime(value: string) {
  return value.slice(0, 5);
}

export function mapMedicine(row: MedicineWithParentRow): MedicineSchedule {
  return {
    id: row.id,
    caregiverId: row.caregiver_id,
    parentId: row.parent_id,
    parentName: row.parents?.name ?? "Unknown parent",
    medicineName: row.medicine_name,
    dosageInstruction: row.dosage_instruction,
    time: normalizeTime(row.scheduled_time),
    mealTiming: (row.food_timing ?? "after_food") as MealTiming,
    frequency: (row.frequency ?? "daily") as Frequency,
    importanceLevel: row.is_important ? "important" : "routine",
    startDate: row.start_date,
    endDate: row.end_date,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toMedicinePayload(input: MedicineScheduleInput, caregiverId: string) {
  validateMedicine(input);
  return {
    caregiver_id: caregiverId,
    parent_id: input.parentId,
    medicine_name: input.medicineName.trim(),
    dosage_instruction: input.dosageInstruction,
    scheduled_time: input.time,
    food_timing: input.mealTiming,
    frequency: input.frequency,
    is_important: input.importanceLevel === "important",
    start_date: input.startDate,
    end_date: input.endDate,
    is_active: input.isActive ?? true
  };
}

export async function listMedicineSchedules(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("medicine_schedules")
    .select("*, parents(name)")
    .order("scheduled_time", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as MedicineWithParentRow[]).map(mapMedicine);
}

export async function createMedicineSchedule(supabase: SupabaseClient<Database>, input: MedicineScheduleInput, userId?: string) {
  const caregiverId = userId ?? await getCurrentUserId(supabase);
  const { data, error } = await supabase
    .from("medicine_schedules")
    .insert(toMedicinePayload(input, caregiverId))
    .select("*, parents(name)")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapMedicine(data as MedicineWithParentRow);
}

export async function updateMedicineSchedule(
  supabase: SupabaseClient<Database>,
  id: string,
  input: MedicineScheduleInput,
  userId?: string
) {
  const caregiverId = userId ?? await getCurrentUserId(supabase);
  const { data, error } = await supabase
    .from("medicine_schedules")
    .update(toMedicinePayload(input, caregiverId))
    .eq("id", id)
    .select("*, parents(name)")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapMedicine(data as MedicineWithParentRow);
}

export async function deactivateMedicineSchedule(supabase: SupabaseClient<Database>, id: string) {
  const { data, error } = await supabase
    .from("medicine_schedules")
    .update({ is_active: false })
    .eq("id", id)
    .select("*, parents(name)")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapMedicine(data as MedicineWithParentRow);
}

export function isScheduleActiveToday(schedule: MedicineSchedule, today = new Date()) {
  return scheduleIsDue({ is_active: schedule.isActive, start_date: schedule.startDate, end_date: schedule.endDate, frequency: schedule.frequency }, localDateKey(today));
}
