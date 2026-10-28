import { callDescription } from "@/lib/call-display";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getLanguageTemplate } from "@/lib/call-scripts";
import { APP_TIMEZONE } from "@/lib/services/timezone";
import type { Database } from "@/lib/database.types";
import type { Alert, AlertSeverity, AlertType, CallLog, CallStatus, ResponseType } from "@/lib/types";

type CallLogRow = Database["public"]["Tables"]["call_logs"]["Row"] & {
  parents?: { name: string | null } | null;
  medicine_schedules?: { medicine_name: string | null } | null;
};
type AlertRow = Database["public"]["Tables"]["alerts"]["Row"] & {
  parents?: { name: string | null } | null;
};

function formatTime(value: string | null) {
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

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: APP_TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function mapCallLog(row: CallLogRow): CallLog {
  const template = getLanguageTemplate(row.script_language ?? "English");
  const scriptText = row.script_text;

  return {
    id: row.id,
    parentName: row.parents?.name ?? "Unknown parent",
    medicine: row.medicine_schedules?.medicine_name ?? "Test call / removed medicine",
    scheduledTime: formatTime(row.scheduled_for),
    status: (row.call_status ?? "pending") as CallStatus,
    response: callDescription(row.call_status, row.notes),
    responseType: row.response_type as ResponseType | null,
    retryCount: row.retry_count,
    createdAt: formatCreatedAt(row.created_at),
    scriptText,
    scriptLanguage: template.language,
    shortPreviewText: scriptText ? `${scriptText.slice(0, 130)}${scriptText.length > 130 ? "..." : ""}` : "Script not generated yet.",
    safetyNote: template.safetyNote,
    audioUrl: row.audio_url,
    transcript: row.transcript
  };
}

function mapAlert(row: AlertRow): Alert {
  return {
    id: row.id,
    type: row.alert_type as AlertType,
    title: row.title,
    parentName: row.parents?.name ?? "Unknown parent",
    description: row.message ?? "",
    severity: (row.severity ?? "medium") as AlertSeverity,
    createdAt: formatCreatedAt(row.created_at),
    isRead: row.is_read
  };
}

export async function listCallLogs(supabase: SupabaseClient<Database>, page?: number) {
  let query = supabase
    .from("call_logs")
    .select("*, parents(name), medicine_schedules(medicine_name)")
    .order("created_at", { ascending: false });
  if (page !== undefined) query = query.range((page - 1) * 25, (page - 1) * 25 + 25);
  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CallLogRow[]).map(mapCallLog);
}

export async function listAlerts(supabase: SupabaseClient<Database>, page?: number) {
  let query = supabase
    .from("alerts")
    .select("*, parents(name)")
    .order("created_at", { ascending: false });
  if (page !== undefined) query = query.range((page - 1) * 25, (page - 1) * 25 + 25);
  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as AlertRow[]).map(mapAlert);
}
