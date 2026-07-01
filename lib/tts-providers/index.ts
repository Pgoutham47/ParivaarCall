import type { TTSProvider } from "@/lib/types";
import { createGoogleTTSProvider } from "@/lib/tts-providers/google";
import { createMockTTSProvider } from "@/lib/tts-providers/mock";
import { createOpenAITTSProvider } from "@/lib/tts-providers/openai";

export type TTSProviderName = "mock" | "google" | "openai";

export function getTTSProvider(name: string | undefined = process.env.TTS_PROVIDER): TTSProvider {
  const providerName = (name ?? "mock") as TTSProviderName;

  switch (providerName) {
    case "google":
      return createGoogleTTSProvider();
    case "openai":
      return createOpenAITTSProvider();
    case "mock":
      return createMockTTSProvider();
    default:
      throw new Error(`Unsupported TTS_PROVIDER: ${providerName}`);
  }
}
