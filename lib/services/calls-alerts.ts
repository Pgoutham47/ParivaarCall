import type { SupabaseClient } from "@supabase/supabase-js";
import { getLanguageTemplate } from "@/lib/call-scripts";
import type { Database } from "@/lib/database.types";
import type { Alert, AlertSeverity, AlertType, AudioStatus, CallLog, CallStatus, ResponseType } from "@/lib/types";

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
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(new Date(value));
}

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
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
    medicine: row.medicine_schedules?.medicine_name ?? "Medicine reminder",
    scheduledTime: formatTime(row.scheduled_for),
    status: (row.call_status ?? "pending") as CallStatus,
    response: row.notes ?? row.response_type ?? "No response recorded yet.",
    responseType: row.response_type as ResponseType | null,
    retryCount: row.retry_count,
    createdAt: formatCreatedAt(row.created_at),
    scriptText,
    scriptLanguage: template.language,
    shortPreviewText: scriptText ? `${scriptText.slice(0, 130)}${scriptText.length > 130 ? "..." : ""}` : "Script not generated yet.",
    safetyNote: template.safetyNote,
    audioUrl: row.audio_url,
    audioStatus: (row.audio_status ?? "not_generated") as AudioStatus,
    audioProvider: row.audio_provider,
    audioGeneratedAt: row.audio_generated_at ? formatCreatedAt(row.audio_generated_at) : null,
    callProvider: row.call_provider,
    providerCallId: row.provider_call_id,
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

export async function listCallLogs(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("call_logs")
    .select("*, parents(name), medicine_schedules(medicine_name)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CallLogRow[]).map(mapCallLog);
}

export async function listAlerts(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("alerts")
    .select("*, parents(name)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as AlertRow[]).map(mapAlert);
}
