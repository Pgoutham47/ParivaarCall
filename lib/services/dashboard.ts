import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getDashboardCallStats, getTodayScheduleWithCallStatus } from "@/lib/services/call-engine";
import { localDateKey } from "@/lib/services/timezone";
import { listMedicineSchedules } from "@/lib/services/medicines";
import { listParents } from "@/lib/services/parents";

export async function getDashboardSummary(supabase: SupabaseClient<Database>) {
  const [parents, schedules, callStats, todaysSchedule] = await Promise.all([
    listParents(supabase),
    listMedicineSchedules(supabase),
    getDashboardCallStats(supabase),
    getTodayScheduleWithCallStatus(supabase)
  ]);

  const activeParents = new Set(parents.filter(parent => parent.status === "active").map(parent => parent.id));
  const activeSchedules = schedules.filter(schedule => schedule.isActive && activeParents.has(schedule.parentId) && (!schedule.endDate || schedule.endDate >= localDateKey()));

  return {
    totalParents: parents.length,
    activeMedicineSchedules: activeSchedules.length,
    todaysMedicineCalls: callStats.scheduledCalls,
    confirmed: callStats.confirmedCalls,
    missed: callStats.missedOrNoAnswerCalls,
    needHelp: callStats.needHelpAlerts,
    todaysSchedule
  };
}
