import type { CallJob, CallPlacement, CallProvider } from "@/lib/types";

const DEFAULT_BOLNA_API_URL = "https://api.bolna.ai";

type BolnaCallResponse = {
  execution_id?: string;
  call_id?: string;
  id?: string;
  status?: string;
  message?: string;
};

// Places a real outbound call: the Bolna voice agent (ASR + LLM + TTS) speaks
// to the parent over the Vobiz telephony line connected in the Bolna dashboard.
// The final outcome arrives asynchronously on /api/webhooks/bolna.
export function createBolnaCallProvider(): CallProvider {
  return {
    name: "bolna",
    async placeCall(job: CallJob): Promise<CallPlacement> {
      const apiKey = process.env.BOLNA_API_KEY;
      const agentId = process.env.BOLNA_AGENT_ID;

      if (!apiKey || !agentId) {
        throw new Error("Bolna is not configured. Set BOLNA_API_KEY and BOLNA_AGENT_ID, or use CALL_PROVIDER=simulated.");
      }

      const apiUrl = process.env.BOLNA_API_URL ?? DEFAULT_BOLNA_API_URL;
      // The Vobiz phone number connected to Bolna (Bolna dashboard -> Providers -> Vobiz).
      const fromPhoneNumber = process.env.BOLNA_FROM_PHONE_NUMBER;

      const response = await fetch(`${apiUrl}/call`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          agent_id: agentId,
          recipient_phone_number: job.parent.phone,
          ...(fromPhoneNumber ? { from_phone_number: fromPhoneNumber } : {}),
          user_data: {
            call_log_id: job.callLog.id,
            parent_name: job.parent.name,
            medicine_name: job.medicineSchedule?.medicine_name ?? "medicine",
            dosage_instruction: job.medicineSchedule?.dosage_instruction ?? "",
            scheduled_time: job.medicineSchedule?.scheduled_time ?? "",
            script_language: job.script.language ?? "English",
            reminder_script: job.script.text ?? "",
            retry_count: job.callLog.retry_count
          }
        })
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Bolna call request failed (${response.status}): ${body.slice(0, 300)}`);
      }

      const payload = (await response.json().catch(() => ({}))) as BolnaCallResponse;
      const providerCallId = payload.execution_id ?? payload.call_id ?? payload.id;

      if (!providerCallId) {
        throw new Error("Bolna response did not include an execution id.");
      }

      return {
        kind: "initiated",
        provider: "bolna",
        providerCallId: String(providerCallId),
        notes: "Bolna voice agent call placed via Vobiz. Awaiting webhook result."
      };
    }
  };
}
