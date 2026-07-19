import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { CallStatus } from "@/lib/types";
import { daysAgo, localDateKey, startOfLocalDay } from "@/lib/services/timezone";

type Client = SupabaseClient<Database>;

const WINDOW_DAYS = 30;
const DAILY_SERIES_DAYS = 14;

// A dose = one medicine schedule on one calendar day. Retries create extra
// call_logs rows for the same dose, so adherence is computed per dose using the
// best outcome the dose ever reached, not per call attempt.
const OUTCOME_PRECEDENCE: CallStatus[] = ["confirmed", "need_help", "missed", "failed", "no_answer", "snoozed", "calling", "pending"];

const FINAL_STATUSES = new Set<CallStatus>(["confirmed", "need_help", "missed", "failed", "no_answer", "snoozed"]);

type DoseOutcome = {
  dateKey: string;
  parentName: string;
  medicineName: string;
  status: CallStatus;
};

export type DailyAdherence = {
  dateKey: string;
  label: string;
  total: number;
  confirmed: number;
  rate: number | null;
};

export type AdherenceBreakdownRow = {
  name: string;
  parentName?: string;
  total: number;
  confirmed: number;
  rate: number;
};

export type AnalyticsSummary = {
  windowDays: number;
  totalDoses: number;
  confirmedDoses: number;
  adherence30: number | null;
  adherence7: number | null;
  streakDays: number;
  daily: DailyAdherence[];
  byMedicine: AdherenceBreakdownRow[];
  byParent: AdherenceBreakdownRow[];
};

function rate(confirmed: number, total: number) {
  return total === 0 ? null : Math.round((confirmed / total) * 100);
}

function dayLabel(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00Z`);

  return new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", day: "numeric", month: "short" }).format(date);
}

export async function getAdherenceSummary(supabase: Client): Promise<AnalyticsSummary> {
  const windowStart = startOfLocalDay(daysAgo(WINDOW_DAYS - 1)).toISOString();

  const { data, error } = await supabase
    .from("call_logs")
    .select("scheduled_for, call_status, medicine_schedule_id, parent_id, parents(name), medicine_schedules(medicine_name)")
    .gte("scheduled_for", windowStart)
    .order("scheduled_for", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  type Row = {
    scheduled_for: string;
    call_status: string;
    medicine_schedule_id: string | null;
    parent_id: string | null;
    parents?: { name: string | null } | null;
    medicine_schedules?: { medicine_name: string | null } | null;
  };

  // Collapse call attempts into doses, keeping the best outcome per dose.
  const doses = new Map<string, DoseOutcome>();

  for (const row of (data ?? []) as Row[]) {
    const status = row.call_status as CallStatus;
    const dateKey = localDateKey(new Date(row.scheduled_for));
    const doseKey = `${row.parent_id ?? "?"}:${row.medicine_schedule_id ?? "?"}:${dateKey}`;
    const existing = doses.get(doseKey);

    if (!existing || OUTCOME_PRECEDENCE.indexOf(status) < OUTCOME_PRECEDENCE.indexOf(existing.status)) {
      doses.set(doseKey, {
        dateKey,
        parentName: row.parents?.name ?? "Unknown parent",
        medicineName: row.medicine_schedules?.medicine_name ?? "Unknown medicine",
        status
      });
    }
  }

  // Only doses that reached a final outcome count toward adherence.
  const finalDoses = Array.from(doses.values()).filter((dose) => FINAL_STATUSES.has(dose.status));

  const last7Keys = new Set(Array.from({ length: 7 }, (_, index) => localDateKey(daysAgo(index))));

  const totalDoses = finalDoses.length;
  const confirmedDoses = finalDoses.filter((dose) => dose.status === "confirmed").length;
  const within7 = finalDoses.filter((dose) => last7Keys.has(dose.dateKey));

  // Daily series for the visible strip.
  const daily: DailyAdherence[] = Array.from({ length: DAILY_SERIES_DAYS }, (_, index) => {
    const dateKey = localDateKey(daysAgo(DAILY_SERIES_DAYS - 1 - index));
    const dayDoses = finalDoses.filter((dose) => dose.dateKey === dateKey);
    const confirmed = dayDoses.filter((dose) => dose.status === "confirmed").length;

    return {
      dateKey,
      label: dayLabel(dateKey),
      total: dayDoses.length,
      confirmed,
      rate: rate(confirmed, dayDoses.length)
    };
  });

  // Streak: consecutive dose-days counting back from today where every
  // finalized dose was confirmed. Days with no finalized doses (including a
  // today that is still in flight) are neutral: skipped, never breaking.
  let streakDays = 0;

  for (let index = 0; index < WINDOW_DAYS; index += 1) {
    const dateKey = localDateKey(daysAgo(index));
    const dayDoses = finalDoses.filter((dose) => dose.dateKey === dateKey);

    if (dayDoses.length === 0) {
      continue;
    }

    if (dayDoses.every((dose) => dose.status === "confirmed")) {
      streakDays += 1;
    } else {
      break;
    }
  }

  const groupBy = (key: (dose: DoseOutcome) => string, parentName?: (dose: DoseOutcome) => string) => {
    const groups = new Map<string, { parentName?: string; total: number; confirmed: number }>();

    for (const dose of finalDoses) {
      const name = key(dose);
      const group = groups.get(name) ?? { parentName: parentName?.(dose), total: 0, confirmed: 0 };
      group.total += 1;
      group.confirmed += dose.status === "confirmed" ? 1 : 0;
      groups.set(name, group);
    }

    return Array.from(groups.entries())
      .map(([name, group]) => ({
        name,
        parentName: group.parentName,
        total: group.total,
        confirmed: group.confirmed,
        rate: rate(group.confirmed, group.total) ?? 0
      }))
      .sort((a, b) => a.rate - b.rate);
  };

  return {
    windowDays: WINDOW_DAYS,
    totalDoses,
    confirmedDoses,
    adherence30: rate(confirmedDoses, totalDoses),
    adherence7: rate(within7.filter((dose) => dose.status === "confirmed").length, within7.length),
    streakDays,
    daily,
    byMedicine: groupBy(
      (dose) => dose.medicineName,
      (dose) => dose.parentName
    ),
    byParent: groupBy((dose) => dose.parentName)
  };
}
