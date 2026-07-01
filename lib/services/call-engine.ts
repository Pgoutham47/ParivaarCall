import type { SupabaseClient } from "@supabase/supabase-js";
import { getCallProvider } from "@/lib/call-providers";
import { generateMedicineReminderScript, getLanguageTemplate } from "@/lib/call-scripts";
import type { Database } from "@/lib/database.types";
import type {
  CallAttemptResult,
  CallJob,
  CallStatus,
  ResponseType,
  SimulatedCallResponse,
  TodayScheduleItem
} from "@/lib/types";

type Client = SupabaseClient<Database>;
type CallLogRow = Database["public"]["Tables"]["call_logs"]["Row"];
type MedicineRow = Database["public"]["Tables"]["medicine_schedules"]["Row"];
type ParentRow = Database["public"]["Tables"]["parents"]["Row"];
type VoiceSettingsRow = Database["public"]["Tables"]["voice_settings"]["Row"];

type CallLogWithRelations = CallLogRow & {
  parents?: Pick<ParentRow, "id" | "name" | "phone" | "relationship" | "language"> | null;
  medicine_schedules?: Pick<MedicineRow, "id" | "medicine_name" | "dosage_instruction" | "scheduled_time" | "food_timing"> | null;
};

const DEFAULT_RETRY_DELAY_MINUTES = 10;
const DEFAULT_MAX_RETRIES = 2;

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

function scheduledDateTime(dateKey: string, scheduledTime: string) {
  return new Date(`${dateKey}T${scheduledTime}`).toISOString();
}

function isScheduleActiveToday(schedule: MedicineRow, dateKey = localDateKey()) {
  if (!schedule.is_active) {
    return false;
  }

  if (schedule.start_date && schedule.start_date > dateKey) {
    return false;
  }

  if (schedule.end_date && schedule.end_date < dateKey) {
    return false;
  }

  return true;
}

function displayTime(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(new Date(value));
}

async function getVoiceSettings(
  supabase: Client,
  caregiverId: string
): Promise<
  Pick<
    VoiceSettingsRow,
    "retry_delay_minutes" | "max_retries" | "preferred_language" | "voice_tone" | "voice_gender" | "speech_speed" | "respect_mode"
  >
> {
  const { data, error } = await supabase
    .from("voice_settings")
    .select("retry_delay_minutes, max_retries, preferred_language, voice_tone, voice_gender, speech_speed, respect_mode")
    .eq("caregiver_id", caregiverId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    retry_delay_minutes: data?.retry_delay_minutes ?? DEFAULT_RETRY_DELAY_MINUTES,
    max_retries: data?.max_retries ?? DEFAULT_MAX_RETRIES,
    preferred_language: data?.preferred_language ?? "Parent preferred language",
    voice_tone: data?.voice_tone ?? "warm",
    voice_gender: data?.voice_gender ?? "female",
    speech_speed: data?.speech_speed ?? "normal",
    respect_mode: data?.respect_mode ?? "formal"
  };
}

function buildScriptPayload(input: {
  parent: Pick<ParentRow, "name" | "relationship" | "language">;
  schedule: Pick<MedicineRow, "medicine_name" | "dosage_instruction" | "food_timing" | "scheduled_time">;
  settings: Pick<VoiceSettingsRow, "preferred_language" | "voice_tone" | "respect_mode">;
  retryCount: number;
}) {
  const language =
    input.settings.preferred_language === "Parent preferred language" ? input.parent.language : input.settings.preferred_language;
  const script = generateMedicineReminderScript({
    parentName: input.parent.name,
    relationship: input.parent.relationship,
    language,
    medicineName: input.schedule.medicine_name,
    dosageInstruction: input.schedule.dosage_instruction,
    foodTiming: input.schedule.food_timing,
    scheduledTime: input.schedule.scheduled_time,
    retryCount: input.retryCount,
    voiceTone: input.settings.voice_tone as "warm" | "calm" | "respectful",
    respectMode: input.settings.respect_mode as "formal" | "casual"
  });

  return {
    script_text: script.scriptText,
    script_language: script.language,
    audio_status: "not_generated"
  };
}

async function createRetryCallLog(
  supabase: Client,
  callLog: CallLogWithRelations,
  settings: Pick<VoiceSettingsRow, "retry_delay_minutes" | "preferred_language" | "voice_tone" | "respect_mode">
) {
  if (!callLog.parents || !callLog.medicine_schedules) {
    throw new Error("Retry call log is missing script details.");
  }

  const scheduledFor = new Date(Date.now() + settings.retry_delay_minutes * 60 * 1000).toISOString();
  const scriptPayload = buildScriptPayload({
    parent: callLog.parents,
    schedule: callLog.medicine_schedules,
    settings,
    retryCount: callLog.retry_count + 1
  });

  const { error } = await supabase.from("call_logs").insert({
    caregiver_id: callLog.caregiver_id,
    parent_id: callLog.parent_id,
    medicine_schedule_id: callLog.medicine_schedule_id,
    scheduled_for: scheduledFor,
    call_status: "pending",
    retry_count: callLog.retry_count + 1,
    retry_parent_call_log_id: callLog.id,
    notes: `Retry scheduled after ${settings.retry_delay_minutes} minutes.`,
    ...scriptPayload
  });

  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }
}

function toCallJob(row: CallLogWithRelations): CallJob {
  if (!row.parents) {
    throw new Error("Call log is missing parent details.");
  }

  return {
    callLog: {
      id: row.id,
      caregiver_id: row.caregiver_id,
      parent_id: row.parent_id,
      medicine_schedule_id: row.medicine_schedule_id,
      scheduled_for: row.scheduled_for,
      retry_count: row.retry_count
    },
    parent: {
      id: row.parents.id,
      name: row.parents.name,
      phone: row.parents.phone
    },
    medicineSchedule: row.medicine_schedules
      ? {
          id: row.medicine_schedules.id,
          medicine_name: row.medicine_schedules.medicine_name,
          dosage_instruction: row.medicine_schedules.dosage_instruction,
          scheduled_time: row.medicine_schedules.scheduled_time
        }
      : null
  };
}

async function getCallLogWithRelations(supabase: Client, callLogId: string) {
  const { data, error } = await supabase
    .from("call_logs")
    .select("*, parents(id, name, phone, relationship, language), medicine_schedules(id, medicine_name, dosage_instruction, scheduled_time, food_timing)")
    .eq("id", callLogId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as CallLogWithRelations;
}

export async function generateTodayCallLogs(supabase: Client) {
  const dateKey = localDateKey();
  const { data, error } = await supabase
    .from("medicine_schedules")
    .select("*, parents!inner(status, name, relationship, language)")
    .eq("is_active", true);

  if (error) {
    throw new Error(error.message);
  }

  let created = 0;
  let skippedDuplicates = 0;
  let eligibleSchedules = 0;
  let skippedIneligible = 0;
  const errors: string[] = [];

  const settingsByCaregiver = new Map<string, Awaited<ReturnType<typeof getVoiceSettings>>>();

  for (const schedule of (data ?? []) as Array<MedicineRow & { parents?: Pick<ParentRow, "status" | "name" | "relationship" | "language"> | null }>) {
    if (!isScheduleActiveToday(schedule, dateKey) || schedule.parents?.status === "inactive") {
      skippedIneligible += 1;
      continue;
    }

    eligibleSchedules += 1;
    const scheduledFor = scheduledDateTime(dateKey, schedule.scheduled_time);
    const { data: existing, error: existingError } = await supabase
      .from("call_logs")
      .select("id")
      .eq("caregiver_id", schedule.caregiver_id)
      .eq("parent_id", schedule.parent_id)
      .eq("medicine_schedule_id", schedule.id)
      .eq("scheduled_for", scheduledFor)
      .maybeSingle();

    if (existingError) {
      errors.push(existingError.message);
      continue;
    }

    if (existing) {
      skippedDuplicates += 1;
      continue;
    }

    const settings = settingsByCaregiver.get(schedule.caregiver_id) ?? (await getVoiceSettings(supabase, schedule.caregiver_id));
    settingsByCaregiver.set(schedule.caregiver_id, settings);
    const scriptPayload = buildScriptPayload({
      parent: {
        name: schedule.parents?.name ?? "Parent",
        relationship: schedule.parents?.relationship ?? "Parent",
        language: schedule.parents?.language ?? "English"
      },
      schedule,
      settings,
      retryCount: 0
    });

    const { error: insertError } = await supabase.from("call_logs").insert({
      caregiver_id: schedule.caregiver_id,
      parent_id: schedule.parent_id,
      medicine_schedule_id: schedule.id,
      scheduled_for: scheduledFor,
      call_status: "pending",
      response_type: null,
      retry_count: 0,
      notes: "Generated by Call Scheduling Engine v1.",
      ...scriptPayload
    });

    if (insertError) {
      if (insertError.code === "23505") {
        skippedDuplicates += 1;
      } else {
        errors.push(insertError.message);
      }
      continue;
    }

    created += 1;
  }

  return {
    activeSchedulesFound: data?.length ?? 0,
    eligibleSchedules,
    skippedIneligible,
    created,
    skippedDuplicates,
    errors
  };
}

export async function getPendingCalls(supabase: Client) {
  const { data, error } = await supabase
    .from("call_logs")
    .select("*, parents(id, name, phone, relationship, language), medicine_schedules(id, medicine_name, dosage_instruction, scheduled_time, food_timing)")
    .eq("call_status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CallLogWithRelations[];
}

export async function updateCallResult(supabase: Client, callLogId: string, result: CallAttemptResult) {
  const { data, error } = await supabase
    .from("call_logs")
    .update({
      call_status: result.status,
      response_type: result.responseType,
      call_ended_at: new Date().toISOString(),
      notes: result.notes ?? null
    })
    .eq("id", callLogId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createAlertFromCallResult(supabase: Client, callLog: CallLogWithRelations) {
  const parentName = callLog.parents?.name ?? "Parent";
  const medicineName = callLog.medicine_schedules?.medicine_name ?? "medicine";

  const alertByStatus: Partial<
    Record<CallStatus, { alert_type: "no_answer" | "missed_medicine" | "need_help"; severity: "medium" | "high" | "critical"; title: string; message: string }>
  > = {
    no_answer: {
      alert_type: "no_answer",
      severity: "medium",
      title: "Parent did not answer",
      message: `${parentName} did not answer the reminder call for ${medicineName}.`
    },
    missed: {
      alert_type: "missed_medicine",
      severity: "high",
      title: "Medicine missed",
      message: `${parentName} missed the reminder for ${medicineName}.`
    },
    need_help: {
      alert_type: "need_help",
      severity: "critical",
      title: "Parent requested help",
      message: `${parentName} requested help. Phone number: ${callLog.parents?.phone ?? "not available"}.`
    }
  };

  const alert = alertByStatus[callLog.call_status as CallStatus];

  if (!alert) {
    return null;
  }

  const { data, error } = await supabase
    .from("alerts")
    .insert({
      caregiver_id: callLog.caregiver_id,
      parent_id: callLog.parent_id,
      medicine_schedule_id: callLog.medicine_schedule_id,
      ...alert
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function processPendingCall(
  supabase: Client,
  callLogId: string,
  options?: { simulatedResponse?: SimulatedCallResponse }
) {
  const callLog = await getCallLogWithRelations(supabase, callLogId);
  const provider = getCallProvider();

  const { error: callingError } = await supabase
    .from("call_logs")
    .update({
      call_status: "calling",
      call_started_at: new Date().toISOString()
    })
    .eq("id", callLogId);

  if (callingError) {
    throw new Error(callingError.message);
  }

  const result = await provider.placeCall(toCallJob(callLog), options);
  const updated = await updateCallResult(supabase, callLogId, result);
  const updatedWithRelations = await getCallLogWithRelations(supabase, updated.id);
  const settings = await getVoiceSettings(supabase, updated.caregiver_id);
  let retryCreated = false;
  let alertCreated = false;

  if ((result.status === "snoozed" || result.status === "no_answer") && updated.retry_count < settings.max_retries) {
    await createRetryCallLog(supabase, updatedWithRelations, settings);
    retryCreated = true;
  } else if (result.status === "no_answer" || result.status === "missed" || result.status === "need_help") {
    const alert = await createAlertFromCallResult(supabase, updatedWithRelations);
    alertCreated = Boolean(alert);
  }

  return { callLog: updatedWithRelations, result, retryCreated, alertCreated };
}

export async function getDashboardCallStats(supabase: Client) {
  const start = startOfLocalDay().toISOString();
  const end = endOfLocalDay().toISOString();

  const [{ count: scheduledCalls, error: scheduledError }, { count: confirmedCalls, error: confirmedError }, { count: missedCalls, error: missedError }, { count: needHelpAlerts, error: helpError }] =
    await Promise.all([
      supabase.from("call_logs").select("id", { count: "exact", head: true }).gte("scheduled_for", start).lt("scheduled_for", end),
      supabase
        .from("call_logs")
        .select("id", { count: "exact", head: true })
        .eq("call_status", "confirmed")
        .gte("scheduled_for", start)
        .lt("scheduled_for", end),
      supabase
        .from("call_logs")
        .select("id", { count: "exact", head: true })
        .in("call_status", ["missed", "no_answer", "failed"])
        .gte("scheduled_for", start)
        .lt("scheduled_for", end),
      supabase.from("alerts").select("id", { count: "exact", head: true }).eq("alert_type", "need_help").eq("is_read", false)
    ]);

  const firstError = scheduledError ?? confirmedError ?? missedError ?? helpError;

  if (firstError) {
    throw new Error(firstError.message);
  }

  return {
    scheduledCalls: scheduledCalls ?? 0,
    confirmedCalls: confirmedCalls ?? 0,
    missedOrNoAnswerCalls: missedCalls ?? 0,
    needHelpAlerts: needHelpAlerts ?? 0
  };
}

export async function getTodayScheduleWithCallStatus(supabase: Client): Promise<TodayScheduleItem[]> {
  const dateKey = localDateKey();
  const start = startOfLocalDay().toISOString();
  const end = endOfLocalDay().toISOString();

  const [{ data: schedules, error: schedulesError }, { data: callLogs, error: callLogsError }] = await Promise.all([
    supabase.from("medicine_schedules").select("*, parents(name, language)").eq("is_active", true).order("scheduled_time", { ascending: true }),
    supabase
      .from("call_logs")
      .select("medicine_schedule_id, scheduled_for, call_status, script_text, script_language")
      .gte("scheduled_for", start)
      .lt("scheduled_for", end)
      .order("created_at", { ascending: false })
  ]);

  if (schedulesError) {
    throw new Error(schedulesError.message);
  }

  if (callLogsError) {
    throw new Error(callLogsError.message);
  }

  const latestBySchedule = new Map<string, { status: CallStatus; scriptGenerated: boolean; language: string | null }>();

  for (const log of callLogs ?? []) {
    if (log.medicine_schedule_id && !latestBySchedule.has(log.medicine_schedule_id)) {
      latestBySchedule.set(log.medicine_schedule_id, {
        status: (log.call_status ?? "pending") as CallStatus,
        scriptGenerated: Boolean(log.script_text),
        language: log.script_language
      });
    }
  }

  return ((schedules ?? []) as Array<MedicineRow & { parents?: { name: string | null; language: string | null } | null }>)
    .filter((schedule) => isScheduleActiveToday(schedule, dateKey))
    .map((schedule) => {
      const latest = latestBySchedule.get(schedule.id);

      return {
        id: schedule.id,
        time: displayTime(scheduledDateTime(dateKey, schedule.scheduled_time)),
        parentName: schedule.parents?.name ?? "Unknown parent",
        medicineName: schedule.medicine_name,
        language: getLanguageTemplate(latest?.language ?? schedule.parents?.language ?? "English").language,
        scriptGenerated: latest?.scriptGenerated ?? false,
        status: latest?.status ?? "not_generated"
      };
    });
}

export function summarizeProcessedResults(results: Array<{ result: { status: CallStatus } }>) {
  return {
    processed: results.length,
    confirmed: results.filter((item) => item.result.status === "confirmed").length,
    missed: results.filter((item) => item.result.status === "missed").length,
    no_answer: results.filter((item) => item.result.status === "no_answer").length,
    need_help: results.filter((item) => item.result.status === "need_help").length,
    snoozed: results.filter((item) => item.result.status === "snoozed").length
  };
}

export function isSimulatedResponse(value: unknown): value is SimulatedCallResponse {
  return value === "confirmed" || value === "snoozed" || value === "no_answer" || value === "missed" || value === "need_help";
}

export function isResponseType(value: unknown): value is ResponseType {
  return (
    value === "dtmf_1_taken" ||
    value === "dtmf_2_later" ||
    value === "dtmf_3_help" ||
    value === "speech_taken" ||
    value === "speech_later" ||
    value === "speech_help" ||
    value === "no_response"
  );
}
