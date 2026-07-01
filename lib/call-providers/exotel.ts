import type { CallProvider } from "@/lib/types";

export function createExotelCallProvider(): CallProvider {
  return {
    name: "exotel",
    async placeCall() {
      // TODO: outbound call creation
      // TODO: DTMF capture
      // TODO: webhook callback
      // TODO: call recording
      // TODO: call status update
      throw new Error("Exotel provider is not implemented yet. Use CALL_PROVIDER=simulated.");
    }
  };
}
