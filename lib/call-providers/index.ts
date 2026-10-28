import type { CallProvider } from "@/lib/types";
import { createBolnaCallProvider } from "@/lib/call-providers/bolna";
import { createSimulatedCallProvider } from "@/lib/call-providers/simulated";

export type CallProviderName = "simulated" | "bolna";

export function getCallProvider(name: string | undefined = process.env.CALL_PROVIDER): CallProvider {
  if (!name && process.env.NODE_ENV === "production") throw new Error("The calling service is not configured.");
  const providerName = (name ?? "simulated") as CallProviderName;

  switch (providerName) {
    case "bolna":
      return createBolnaCallProvider();
    case "simulated":
      return createSimulatedCallProvider();
    default:
      throw new Error(`Unsupported CALL_PROVIDER: ${providerName}`);
  }
}
