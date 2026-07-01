import type { TTSProvider } from "@/lib/types";

export function createMockTTSProvider(): TTSProvider {
  return {
    name: "mock",
    async generateSpeech() {
      return {
        audioUrl: null,
        audioStatus: "mock_generated",
        provider: "mock"
      };
    }
  };
}
