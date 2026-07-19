import type { CallAttemptResult, CallJob, CallPlacement, CallProvider, SimulatedCallResponse } from "@/lib/types";

const responseMap: Record<SimulatedCallResponse, CallAttemptResult> = {
  confirmed: {
    status: "confirmed",
    responseType: "dtmf_1_taken",
    notes: "Simulated call: parent confirmed medicine was taken."
  },
  snoozed: {
    status: "snoozed",
    responseType: "dtmf_2_later",
    notes: "Simulated call: parent asked to be reminded later."
  },
  no_answer: {
    status: "no_answer",
    responseType: "no_response",
    notes: "Simulated call: parent did not answer."
  },
  missed: {
    status: "missed",
    responseType: "no_response",
    notes: "Simulated call: medicine reminder was missed."
  },
  need_help: {
    status: "need_help",
    responseType: "dtmf_3_help",
    notes: "Simulated call: parent requested help."
  }
};

function chooseRandomResponse(): SimulatedCallResponse {
  const roll = Math.random();

  if (roll < 0.6) {
    return "confirmed";
  }

  if (roll < 0.7) {
    return "snoozed";
  }

  if (roll < 0.85) {
    return "no_answer";
  }

  if (roll < 0.95) {
    return "missed";
  }

  return "need_help";
}

export function createSimulatedCallProvider(): CallProvider {
  return {
    name: "simulated",
    async placeCall(_job: CallJob, options?: { simulatedResponse?: SimulatedCallResponse }): Promise<CallPlacement> {
      const randomSimulationAllowed =
        process.env.NODE_ENV !== "production" || process.env.ALLOW_RANDOM_SIMULATED_CALLS === "true";
      const response = options?.simulatedResponse ?? (randomSimulationAllowed ? chooseRandomResponse() : "no_answer");

      return { kind: "completed", result: responseMap[response] };
    }
  };
}
