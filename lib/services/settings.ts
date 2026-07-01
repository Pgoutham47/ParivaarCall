import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { RespectMode, SpeechSpeed, VoiceGender, VoiceSettings, VoiceSettingsInput, VoiceTone } from "@/lib/types";
import { getCurrentUserId } from "@/lib/services/auth";

type VoiceSettingsRow = Database["public"]["Tables"]["voice_settings"]["Row"];

function mapSettings(row: VoiceSettingsRow): VoiceSettings {
  return {
    id: row.id,
    caregiverId: row.caregiver_id,
    languagePreference: row.preferred_language,
    voiceGender: row.voice_gender as VoiceGender,
    tone: row.voice_tone as VoiceTone,
    speechSpeed: (row.speech_speed ?? "normal") as SpeechSpeed,
    respectMode: (row.respect_mode ?? "formal") as RespectMode,
    retryAttempts: row.max_retries,
    retryGapMinutes: row.retry_delay_minutes,
    notifications: {
      whatsapp: row.whatsapp_enabled,
      sms: row.sms_enabled,
      email: row.email_enabled
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toSettingsPayload(input: VoiceSettingsInput, caregiverId: string) {
  return {
    caregiver_id: caregiverId,
    preferred_language: input.languagePreference,
    voice_gender: input.voiceGender,
    voice_tone: input.tone,
    speech_speed: input.speechSpeed,
    respect_mode: input.respectMode,
    retry_delay_minutes: input.retryGapMinutes,
    max_retries: input.retryAttempts,
    whatsapp_enabled: input.notifications.whatsapp,
    sms_enabled: input.notifications.sms,
    email_enabled: input.notifications.email
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
