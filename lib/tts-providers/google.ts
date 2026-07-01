import type { TTSProvider } from "@/lib/types";

export function createGoogleTTSProvider(): TTSProvider {
  return {
    name: "google",
    async generateSpeech() {
      if (!process.env.GOOGLE_TTS_API_KEY && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        return {
          audioStatus: "failed",
          provider: "google",
          error: "Google TTS is selected but GOOGLE_TTS_API_KEY or GOOGLE_APPLICATION_CREDENTIALS is missing."
        };
      }

      // TODO: synthesize speech with Google Cloud Text-to-Speech
      // TODO: choose a safe voice by supported language, gender, tone, and speech speed
      // TODO: store generated audio in TTS_STORAGE_BUCKET
      // TODO: return the storage URL for future telephony playback
      return {
        audioStatus: "failed",
        provider: "google",
        error: "Google TTS provider placeholder is not implemented yet."
      };
    }
  };
}
