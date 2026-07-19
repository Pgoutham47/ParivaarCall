import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { RespectMode, VoiceSettings, VoiceSettingsInput } from "@/lib/types";
import { getCurrentUserId } from "@/lib/services/auth";

type VoiceSettingsRow = Database["public"]["Tables"]["voice_settings"]["Row"];

function mapSettings(row: VoiceSettingsRow): VoiceSettings {
  return {
    id: row.id,
    caregiverId: row.caregiver_id,
    languagePreference: row.preferred_language,
    respectMode: (row.respect_mode ?? "formal") as RespectMode,
    retryAttempts: row.max_retries,
    retryGapMinutes: row.retry_delay_minutes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toSettingsPayload(input: VoiceSettingsInput, caregiverId: string) {
  return {
    caregiver_id: caregiverId,
    preferred_language: input.languagePreference,
    respect_mode: input.respectMode,
    retry_delay_minutes: input.retryGapMinutes,
    max_retries: input.retryAttempts
  };
}

export async function getOrCreateVoiceSettings(supabase: SupabaseClient<Database>) {
  const caregiverId = await getCurrentUserId(supabase);
  const { data, error } = await supabase
    .from("voice_settings")
    .select("*")
    .eq("caregiver_id", caregiverId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    return mapSettings(data);
  }

  const { data: created, error: createError } = await supabase
    .from("voice_settings")
    .insert({ caregiver_id: caregiverId })
    .select("*")
    .single();

  if (createError) {
    throw new Error(createError.message);
  }

  return mapSettings(created);
}

export async function updateVoiceSettings(supabase: SupabaseClient<Database>, input: VoiceSettingsInput) {
  const caregiverId = await getCurrentUserId(supabase);
  const { data, error } = await supabase
    .from("voice_settings")
    .upsert(toSettingsPayload(input, caregiverId), { onConflict: "caregiver_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapSettings(data);
}
