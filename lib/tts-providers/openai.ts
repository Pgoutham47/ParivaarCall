import type { TTSProvider } from "@/lib/types";

export function createOpenAITTSProvider(): TTSProvider {
  return {
    name: "openai",
    async generateSpeech() {
      if (!process.env.OPENAI_API_KEY) {
        return {
          audioStatus: "failed",
          provider: "openai",
          error: "OpenAI TTS is selected but OPENAI_API_KEY is missing."
        };
      }

      // TODO: synthesize speech with OpenAI text-to-speech
      // TODO: choose a non-cloned preset voice by language, gender, tone, and speech speed
      // TODO: store generated audio in TTS_STORAGE_BUCKET
      // TODO: return the storage URL for future telephony playback
      return {
        audioStatus: "failed",
        provider: "openai",
        error: "OpenAI TTS provider placeholder is not implemented yet."
      };
    }
  };
}
