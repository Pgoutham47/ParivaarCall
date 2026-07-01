import type { CallProvider } from "@/lib/types";

export function createTwilioCallProvider(): CallProvider {
  return {
    name: "twilio",
    async placeCall() {
      // TODO: outbound call creation
      // TODO: DTMF capture
      // TODO: webhook callback
      // TODO: call recording
      // TODO: call status update
      throw new Error("Twilio provider is not implemented yet. Use CALL_PROVIDER=simulated.");
    }
  };
}
