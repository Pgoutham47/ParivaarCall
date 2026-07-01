import type { SupabaseClient } from "@supabase/supabase-js";
import { getTTSProvider } from "@/lib/tts-providers";
import type { Database } from "@/lib/database.types";
import type { TTSResult } from "@/lib/types";

type Client = SupabaseClient<Database>;
type CallLogRow = Database["public"]["Tables"]["call_logs"]["Row"];

async function getVoiceSettingsForCall(supabase: Client, caregiverId: string) {
  const { data, error } = await supabase
    .from("voice_settings")
    .select("voice_gender, voice_tone")
    .eq("caregiver_id", caregiverId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    voiceGender: data?.voice_gender ?? "female",
    tone: data?.voice_tone ?? "warm"
  };
}

async function updateAudioResult(supabase: Client, callLogId: string, result: TTSResult) {
  const { data, error } = await supabase
    .from("call_logs")
    .update({
      audio_url: result.audioUrl ?? null,
      audio_status: result.audioStatus,
      audio_provider: result.provider,
      audio_generated_at: new Date().toISOString(),
      notes: result.error ? `Audio generation failed: ${result.error}` : undefined
    })
    .eq("id", callLogId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function generateAudioForCallLog(supabase: Client, callLogId: string) {
  const { data: callLog, error } = await supabase.from("call_logs").select("*").eq("id", callLogId).single();

  if (error) {
    throw new Error(error.message);
  }

  if (!callLog.script_text) {
    const failed: TTSResult = {
      audioStatus: "failed" as const,
      provider: getTTSProvider().name,
      error: "Call log does not have script_text. Generate call logs again after applying the script migration."
    };
    const updated = await updateAudioResult(supabase, callLogId, failed);
    return { callLog: updated, result: failed };
  }

  const settings = await getVoiceSettingsForCall(supabase, callLog.caregiver_id);
  const provider = getTTSProvider();
  const result = await provider.generateSpeech({
    text: callLog.script_text,
    language: callLog.script_language ?? "English",
    voiceGender: settings.voiceGender as "female" | "male",
    tone: settings.tone as "warm" | "calm" | "respectful",
    callLogId
  });
  const updated = await updateAudioResult(supabase, callLogId, result);

  return { callLog: updated, result };
}

export async function getPendingAudioCallLogs(supabase: Client) {
  const { data, error } = await supabase
    .from("call_logs")
    .select("*")
    .eq("audio_status", "not_generated")
    .not("script_text", "is", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CallLogRow[];
}

export async function generatePendingAudio(supabase: Client) {
  const pending = await getPendingAudioCallLogs(supabase);
  let generated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const callLog of pending) {
    try {
      const { result } = await generateAudioForCallLog(supabase, callLog.id);

      if (result.audioStatus === "failed") {
        failed += 1;
        if (result.error) {
          errors.push(result.error);
        }
      } else {
        generated += 1;
      }
    } catch (error) {
      failed += 1;
      errors.push(error instanceof Error ? error.message : "Unknown audio generation error.");
    }
  }

  return {
    processed: pending.length,
    generated,
    failed,
    errors
  };
}
