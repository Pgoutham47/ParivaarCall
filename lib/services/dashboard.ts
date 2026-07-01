import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getDashboardCallStats, getTodayScheduleWithCallStatus } from "@/lib/services/call-engine";
import { listMedicineSchedules } from "@/lib/services/medicines";
import { listParents } from "@/lib/services/parents";

export async function getDashboardSummary(supabase: SupabaseClient<Database>) {
  const [parents, schedules, callStats, todaysSchedule] = await Promise.all([
    listParents(supabase),
    listMedicineSchedules(supabase),
    getDashboardCallStats(supabase),
    getTodayScheduleWithCallStatus(supabase)
  ]);

  const activeSchedules = schedules.filter((schedule) => schedule.isActive);

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
