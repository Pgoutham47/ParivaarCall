import type { SupabaseClient } from "@supabase/supabase-js";
import { scheduleIsDue } from "@/lib/schedule-rules";
import { canCallNumber } from "@/lib/calling-access";
import { resolveCallLanguage, testCallScripts } from "@/lib/voice-languages";
import { getCallProvider } from "@/lib/call-providers";
import { generateMedicineReminderScript, getLanguageTemplate } from "@/lib/call-scripts";
import { sendAlertEmail } from "@/lib/services/notifications";
import { APP_TIMEZONE, endOfLocalDay, localDateKey, startOfLocalDay, zonedDateTimeToUtc } from "@/lib/services/timezone";
import type { Database } from "@/lib/database.types";
import type {
  CallAttemptResult,
  CallJob,
  CallPlacement,
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
  parents?: Pick<ParentRow, "id" | "name" | "phone" | "relationship" | "language" | "caregiver_id" | "status" | "updated_at"> | null;
  medicine_schedules?: Pick<MedicineRow, "id" | "medicine_name" | "dosage_instruction" | "scheduled_time" | "food_timing" | "caregiver_id" | "parent_id" | "is_active" | "start_date" | "end_date" | "frequency" | "updated_at"> | null;
};

const DEFAULT_RETRY_DELAY_MINUTES = 10;
const DEFAULT_MAX_RETRIES = 2;

function scheduledDateTime(dateKey: string, scheduledTime: string) {
  return zonedDateTimeToUtc(dateKey, scheduledTime).toISOString();
}

function isScheduleActiveToday(schedule: MedicineRow, dateKey = localDateKey()) {
  return scheduleIsDue(schedule, dateKey);
}

function displayTime(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: APP_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(new Date(value));
}

async function getVoiceSettings(
  supabase: Client,
  caregiverId: string
): Promise<
  Pick<VoiceSettingsRow, "retry_delay_minutes" | "max_retries" | "preferred_language" | "respect_mode">
> {
  const { data, error } = await supabase
    .from("voice_settings")
    .select("retry_delay_minutes, max_retries, preferred_language, respect_mode")
    .eq("caregiver_id", caregiverId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    retry_delay_minutes: data?.retry_delay_minutes ?? DEFAULT_RETRY_DELAY_MINUTES,
    max_retries: data?.max_retries ?? DEFAULT_MAX_RETRIES,
    preferred_language: data?.preferred_language ?? "Parent preferred language",
    respect_mode: data?.respect_mode ?? "formal"
  };
}

function buildScriptPayload(input: {
  parent: Pick<ParentRow, "name" | "relationship" | "language">;
  schedule: Pick<MedicineRow, "medicine_name" | "dosage_instruction" | "food_timing" | "scheduled_time">;
  settings: Pick<VoiceSettingsRow, "preferred_language" | "respect_mode">;
  retryCount: number;
}) {
  const language = resolveCallLanguage(input.settings.preferred_language, input.parent.language);
  const script = generateMedicineReminderScript({
    parentName: input.parent.name,
    relationship: input.parent.relationship,
    language,
    medicineName: input.schedule.medicine_name,
    dosageInstruction: input.schedule.dosage_instruction,
    foodTiming: input.schedule.food_timing,
    scheduledTime: input.schedule.scheduled_time,
    retryCount: input.retryCount,
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
  settings: Pick<VoiceSettingsRow, "retry_delay_minutes" | "preferred_language" | "respect_mode">
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

function toCallJob(row: CallLogWithRelations, settings: Awaited<ReturnType<typeof getVoiceSettings>>): CallJob {
  if (!row.parents) {
    throw new Error("Call log is missing parent details.");
  }

  return {
    voiceSettings: {
      respectMode: settings.respect_mode === "casual" ? "casual" : "formal",
      retryDelayMinutes: settings.retry_delay_minutes,
      retriesRemaining: row.medicine_schedule_id ? Math.max(0, settings.max_retries - row.retry_count) : 0
    },
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
      : null,
    script: {
      text: row.script_text,
      language: row.script_language
    }
  };
}

async function getCallLogWithRelations(supabase: Client, callLogId: string) {
  const { data, error } = await supabase
    .from("call_logs")
    .select("*, parents(id, name, phone, relationship, language, caregiver_id, status, updated_at), medicine_schedules(id, medicine_name, dosage_instruction, scheduled_time, food_timing, caregiver_id, parent_id, is_active, start_date, end_date, frequency, updated_at)")
    .eq("id", callLogId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as CallLogWithRelations;
}

type ScheduleWithParent = MedicineRow & {
  parents?: Pick<ParentRow, "status" | "name" | "relationship" | "language"> | null;
};

type CallLogCreateOutcome = "created" | "duplicate" | "ineligible" | "in_past";

// Creates the pending call log for one schedule on one day. Shared by the daily
// generator and by the immediate generation that runs when a caregiver saves a
// medicine, so both produce identical rows.
async function createCallLogForSchedule(
  supabase: Client,
  schedule: ScheduleWithParent,
  dateKey: string,
  settings: Awaited<ReturnType<typeof getVoiceSettings>>,
  options?: { skipPastTimes?: boolean }
): Promise<CallLogCreateOutcome> {
  if (!isScheduleActiveToday(schedule, dateKey) || schedule.parents?.status !== "active") {
    return "ineligible";
  }

  const scheduledFor = scheduledDateTime(dateKey, schedule.scheduled_time);

  // When a caregiver adds a medicine whose time already passed today, creating
  // the log would make the engine dial immediately. Wait for tomorrow instead.
  if (options?.skipPastTimes && new Date(scheduledFor).getTime() <= Date.now()) {
    return "in_past";
  }

  const { data: existing, error: existingError } = await supabase
    .from("call_logs")
    .select("id")
    .eq("caregiver_id", schedule.caregiver_id)
    .eq("parent_id", schedule.parent_id)
    .eq("medicine_schedule_id", schedule.id)
    .eq("scheduled_for", scheduledFor)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    return "duplicate";
  }

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
      return "duplicate";
    }

    throw new Error(insertError.message);
  }

  return "created";
}

// Called right after a caregiver creates or edits a medicine. Without this a
// new medicine gets no call log until the next nightly run, so a reminder added
// during the day would silently never fire.
export async function generateCallLogForSchedule(supabase: Client, scheduleId: string) {
  const dateKey = localDateKey();
  const { data, error } = await supabase
    .from("medicine_schedules")
    .select("*, parents(status, name, relationship, language)")
    .eq("id", scheduleId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return { outcome: "ineligible" as CallLogCreateOutcome };
  }

  const schedule = data as ScheduleWithParent;

  if (!schedule.is_active) {
    return { outcome: "ineligible" as CallLogCreateOutcome };
  }

  const settings = await getVoiceSettings(supabase, schedule.caregiver_id);
  const outcome = await createCallLogForSchedule(supabase, schedule, dateKey, settings, { skipPastTimes: true });

  return { outcome };
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

  for (const schedule of (data ?? []) as ScheduleWithParent[]) {
    try {
      const settings = settingsByCaregiver.get(schedule.caregiver_id) ?? (await getVoiceSettings(supabase, schedule.caregiver_id));
      settingsByCaregiver.set(schedule.caregiver_id, settings);

      const outcome = await createCallLogForSchedule(supabase, schedule, dateKey, settings);

      if (outcome === "ineligible") {
        skippedIneligible += 1;
        continue;
      }

      eligibleSchedules += 1;

      if (outcome === "duplicate") {
        skippedDuplicates += 1;
      } else if (outcome === "created") {
        created += 1;
      }
    } catch (scheduleError) {
      errors.push(scheduleError instanceof Error ? scheduleError.message : "Unknown generation error.");
    }
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
    .select("*, parents(id, name, phone, relationship, language, caregiver_id, status, updated_at), medicine_schedules(id, medicine_name, dosage_instruction, scheduled_time, food_timing, caregiver_id, parent_id, is_active, start_date, end_date, frequency, updated_at)")
    .eq("call_status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CallLogWithRelations[];
}

// `onlyIfStatusIn` makes finalization a claim rather than a blind write. Bolna
// can deliver the same result more than once, and the reconcile job can race a
// late webhook; without the guard each delivery would create its own alert and
// its own retry.
export async function updateCallResult(
  supabase: Client,
  callLogId: string,
  result: CallAttemptResult,
  options?: { onlyIfStatusIn?: CallStatus[] }
) {
  let query = supabase
    .from("call_logs")
    .update({
      call_status: result.status,
      response_type: result.responseType,
      call_ended_at: new Date().toISOString(),
      notes: result.notes ?? null
    })
    .eq("id", callLogId);

  if (options?.onlyIfStatusIn) {
    query = query.in("call_status", options.onlyIfStatusIn);
  }

  const { data, error } = await query.select("*").maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createAlertFromCallResult(supabase: Client, callLog: CallLogWithRelations) {
  const parentName = callLog.parents?.name ?? "Parent";
  const medicineName = callLog.medicine_schedules?.medicine_name ?? "medicine";

  const alertByStatus: Partial<
    Record<CallStatus, { alert_type: "no_answer" | "missed_medicine" | "need_help" | "call_failed"; severity: "medium" | "high" | "critical"; title: string; message: string }>
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
    },
    failed: {
      alert_type: "call_failed",
      severity: "high",
      title: "Reminder call failed",
      message: `The reminder call to ${parentName} for ${medicineName} could not be completed. Check number verification or contact your account administrator.`
    },
    // Only reached when retries are exhausted; an active snooze creates a retry instead.
    snoozed: {
      alert_type: "missed_medicine",
      severity: "high",
      title: "Medicine not confirmed",
      message: `${parentName} asked to be reminded later about ${medicineName}, but the retry limit was reached and no more calls will be placed today.`
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

  // Notify the caregiver right away; a critical alert sitting unseen in the
  // dashboard defeats the point. Failures are logged, never thrown.
  const notification = await sendAlertEmail({
    caregiverId: callLog.caregiver_id,
    alertType: alert.alert_type,
    severity: alert.severity,
    title: alert.title,
    message: alert.message,
    parentName
  });

  if (!notification.sent && !notification.skipped) {
    console.warn(`[notifications] alert email not sent: ${notification.reason}`);
  }

  return data;
}

export async function finalizeCallResult(
  supabase: Client,
  callLogId: string,
  result: CallAttemptResult,
  options?: { onlyIfStatusIn?: CallStatus[] }
) {
  const updated = await updateCallResult(supabase, callLogId, result, options);

  // Someone else finalized this call first. Doing nothing here is what keeps
  // duplicate alerts and duplicate retries from being created.
  if (!updated) {
    return null;
  }

  const updatedWithRelations = await getCallLogWithRelations(supabase, updated.id);
  const settings = await getVoiceSettings(supabase, updated.caregiver_id);
  let retryCreated = false;
  let alertCreated = false;

  const schedule = updatedWithRelations.medicine_schedules;
  const retryDay = localDateKey(new Date(Date.now() + settings.retry_delay_minutes * 60000));
  const canRetry = schedule && scheduleIsDue(schedule, retryDay) && updatedWithRelations.parents?.status === "active" && retryDay === localDateKey(new Date(updated.scheduled_for ?? updated.created_at));
  if (canRetry && (result.status === "snoozed" || result.status === "no_answer") && updated.retry_count < settings.max_retries) {
    await createRetryCallLog(supabase, updatedWithRelations, settings);
    retryCreated = true;
  } else if (
    result.status === "no_answer" ||
    result.status === "missed" ||
    result.status === "need_help" ||
    result.status === "failed" ||
    result.status === "snoozed"
  ) {
    const alert = await createAlertFromCallResult(supabase, updatedWithRelations);
    alertCreated = Boolean(alert);
  }

  return { callLog: updatedWithRelations, status: result.status as CallStatus, responseType: result.responseType, retryCreated, alertCreated };
}

// Calls stuck in "calling" mean the provider webhook never arrived (or the
// placement crashed mid-flight). The reconcile job polls these against Bolna.
export async function getStuckCallingLogs(supabase: Client, olderThanMinutes: number, limit = 25) {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("call_logs")
    .select("*, parents(id, name, phone, relationship, language, caregiver_id, status, updated_at), medicine_schedules(id, medicine_name, dosage_instruction, scheduled_time, food_timing, caregiver_id, parent_id, is_active, start_date, end_date, frequency, updated_at)")
    .eq("call_status", "calling")
    .lt("call_started_at", cutoff)
    .order("call_started_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CallLogWithRelations[];
}

export async function findCallLogByProviderCallId(supabase: Client, providerCallId: string) {
  const { data, error } = await supabase
    .from("call_logs")
    .select("*, parents(id, name, phone, relationship, language, caregiver_id, status, updated_at), medicine_schedules(id, medicine_name, dosage_instruction, scheduled_time, food_timing, caregiver_id, parent_id, is_active, start_date, end_date, frequency, updated_at)")
    .eq("provider_call_id", providerCallId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as CallLogWithRelations | null;
}

export async function processPendingCall(
  supabase: Client,
  callLogId: string,
  options?: { simulatedResponse?: SimulatedCallResponse }
) {
  // Claim the row: only a transition from pending can proceed, so overlapping
  // cron runs or a re-sent process-one request cannot dial the parent twice.
  const { data: claimed, error: callingError } = await supabase.rpc("claim_pending_call", { p_id: callLogId });
  if (callingError) throw new Error(callingError.message);
  if (!claimed) return null;

  // Check ownership and current state again immediately before placing a call.
  // A deleted/paused/edited schedule must never use an old queued script.
  const latest = await getCallLogWithRelations(supabase, callLogId);
  if (!latest.medicine_schedule_id) {
    // The test endpoint reserves a future slot so a scheduler cannot race its
    // immediate request. Once claimed, display the actual request time.
    const started = new Date().toISOString();
    const { error } = await supabase.from("call_logs").update({ scheduled_for: started }).eq("id", callLogId).eq("call_status", "calling");
    if (error) throw new Error(error.message);
    latest.scheduled_for = started;
  }
  const schedule = latest.medicine_schedules;
  const parent = latest.parents;
  const stale = Date.now() - Date.parse(latest.scheduled_for ?? latest.created_at) > 15 * 60000;
  const invalid = !parent || parent.caregiver_id !== latest.caregiver_id || parent.status !== "active" ||
    (latest.medicine_schedule_id && (!schedule || schedule.caregiver_id !== latest.caregiver_id || schedule.parent_id !== parent.id || !scheduleIsDue(schedule, localDateKey()) || Date.parse(schedule.updated_at) > Date.parse(latest.created_at))) ||
    Date.parse(parent?.updated_at ?? "") > Date.parse(latest.created_at);
  if (invalid || stale || !canCallNumber(parent?.phone ?? "", latest.caregiver_id)) {
    const stopped = await finalizeCallResult(supabase, callLogId, { status: "failed", responseType: "no_response", notes: invalid || stale ? "Reminder cancelled: parent or schedule changed, paused, deleted or expired." : "This number is not verified for trial account calling." }, { onlyIfStatusIn: ["calling"] });
    return stopped ? { ...stopped, providerCallId: undefined } : null;
  }
  // No schedule means a one-time test call; scripts for that path are generated
  // by the authenticated test endpoint, never accepted from the browser.
  let placement: CallPlacement;

  try {
    // Queues may have been generated hours before a preference was changed.
    // Resolve settings immediately before dialing and save the actual script.
    const settings = await getVoiceSettings(supabase, latest.caregiver_id);
    if (latest.retry_count > settings.max_retries) {
      const stopped = await finalizeCallResult(supabase, callLogId, { status: "failed", responseType: "no_response", notes: "Reminder cancelled: retry limit was reduced in settings." }, { onlyIfStatusIn: ["calling"] });
      return stopped ? { ...stopped, providerCallId: undefined } : null;
    }
    const language = resolveCallLanguage(settings.preferred_language, parent!.language);
    const script = schedule
      ? buildScriptPayload({ parent: parent!, schedule, settings, retryCount: latest.retry_count })
      : { script_text: testCallScripts[language], script_language: language, audio_status: "not_generated" };
    const { error: scriptError } = await supabase.from("call_logs").update(script).eq("id", callLogId).eq("call_status", "calling");
    if (scriptError) throw new Error(scriptError.message);
    Object.assign(latest, script);
    placement = await getCallProvider().placeCall(toCallJob(latest, settings), options);
  } catch (error) {
    // A timeout/network error can occur after the remote service accepted the
    // call. Keep the claim for its callback/reconciliation; never dial it again.
    if (error instanceof Error && ["AbortError", "TimeoutError", "TypeError"].includes(error.name)) {
      const { error: saveError } = await supabase.from("call_logs").update({ notes: "Call request is being checked. Waiting for the final result." }).eq("id", callLogId).eq("call_status", "calling");
      if (saveError) throw new Error(saveError.message);
      return { callLog: latest, status: "calling" as CallStatus, responseType: null, retryCreated: false, alertCreated: false, providerCallId: undefined };
    }
    // An explicit rejection is final and visible in the caregiver's alerts.
    const message = error instanceof Error && /verified|trial accounts/i.test(error.message) ? "This number is not verified for trial account calling." : "Calling service unavailable. Contact your account administrator.";
    const failed = await finalizeCallResult(supabase, callLogId, {
      status: "failed",
      responseType: "no_response",
      notes: `Call could not be placed: ${message}`
    });

    return failed ? { ...failed, providerCallId: undefined } : null;
  }

  if (placement.kind === "initiated") {
    // Bolna is dialing through Vobiz; the outcome lands on /api/webhooks/bolna.
    const { error: initiatedError } = await supabase
      .from("call_logs")
      .update({
        call_provider: placement.provider,
        provider_call_id: placement.providerCallId,
        notes: placement.notes ?? null
      })
      .eq("id", callLogId)
      .eq("call_status", "calling");

    if (initiatedError) {
      throw new Error(initiatedError.message);
    }

    const updatedWithRelations = await getCallLogWithRelations(supabase, callLogId);

    return {
      callLog: updatedWithRelations,
      status: "calling" as CallStatus,
      responseType: null,
      retryCreated: false,
      alertCreated: false,
      providerCallId: placement.providerCallId
    };
  }

  const completed = await finalizeCallResult(supabase, callLogId, placement.result);

  return completed ? { ...completed, providerCallId: undefined } : null;
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
    supabase.from("medicine_schedules").select("*, parents(name, language, status)").eq("is_active", true).order("scheduled_time", { ascending: true }),
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

  return ((schedules ?? []) as Array<MedicineRow & { parents?: { name: string | null; language: string | null; status: string | null } | null }>)
    .filter((schedule) => isScheduleActiveToday(schedule, dateKey) && schedule.parents?.status === "active")
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

export function summarizeProcessedResults(results: Array<{ status: CallStatus }>) {
  return {
    processed: results.length,
    calling: results.filter((item) => item.status === "calling").length,
    confirmed: results.filter((item) => item.status === "confirmed").length,
    missed: results.filter((item) => item.status === "missed").length,
    no_answer: results.filter((item) => item.status === "no_answer").length,
    need_help: results.filter((item) => item.status === "need_help").length,
    snoozed: results.filter((item) => item.status === "snoozed").length,
    failed: results.filter((item) => item.status === "failed").length
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
