import type { CallProvider } from "@/lib/types";
import { createExotelCallProvider } from "@/lib/call-providers/exotel";
import { createSimulatedCallProvider } from "@/lib/call-providers/simulated";
import { createTwilioCallProvider } from "@/lib/call-providers/twilio";

export type CallProviderName = "simulated" | "exotel" | "twilio";

export function getCallProvider(name: string | undefined = process.env.CALL_PROVIDER): CallProvider {
  const providerName = (name ?? "simulated") as CallProviderName;

  switch (providerName) {
    case "exotel":
      return createExotelCallProvider();
    case "twilio":
      return createTwilioCallProvider();
    case "simulated":
      return createSimulatedCallProvider();
    default:
      throw new Error(`Unsupported CALL_PROVIDER: ${providerName}`);
  }
}
