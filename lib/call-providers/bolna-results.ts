import type { CallAttemptResult, ResponseType } from "@/lib/types";

// Shared mapping from a Bolna execution payload to a call result. Used by the
// webhook (push) and the reconcile job (pull), so both paths classify calls
// identically.
export type BolnaExecutionPayload = {
  id?: string;
  execution_id?: string;
  call_id?: string;
  agent_id?: string;
  status?: string;
  answered_by_voice_mail?: boolean;
  conversation_duration?: number;
  transcript?: string;
  extracted_data?: Record<string, unknown> | null;
  context_details?: { recipient_data?: Record<string, unknown> | null } | null;
  user_data?: Record<string, unknown> | null;
  telephony_data?: { recording_url?: string | null; call_type?: string | null } | null;
};

const NO_ANSWER_STATUSES = new Set(["busy", "no-answer", "no_answer", "not-connected", "not_connected", "canceled", "cancelled", "queued_timeout"]);
const FAILED_STATUSES = new Set(["error", "failed", "balance-low", "balance_low"]);
// A disconnected call still has post-call extraction pending. Only the later
// completed event contains the final outcome and recording.
const IN_PROGRESS_STATUSES = new Set(["queued", "initiated", "ringing", "in-progress", "in_progress", "ongoing", "started", "calling", "call-disconnected", "call_disconnected"]);

export function isExecutionInProgress(status: string | undefined | null) {
  return IN_PROGRESS_STATUSES.has((status ?? "").toLowerCase());
}

// The Bolna agent should be configured to extract `reminder_outcome` from the
// conversation with one of: taken | later | help | no_response.
function extractedOutcome(payload: BolnaExecutionPayload): string | null {
  const extracted = payload.extracted_data;

  if (!extracted || typeof extracted !== "object") {
    return null;
  }

  // Current Bolna extractions are grouped by category, with an objective
  // answer inside the named field. Keep legacy flat fields working too.
  const readValue = (raw: unknown): string | null => {
    if (typeof raw === "string") return raw.trim().toLowerCase();
    if (!raw || typeof raw !== "object") return null;
    const answer = (raw as Record<string, unknown>).objective;
    if (typeof answer === "string") return answer.trim().toLowerCase();
    if (answer && typeof answer === "object" && "value" in answer && typeof answer.value === "string") {
      return answer.value.trim().toLowerCase();
    }
    return null;
  };
  const direct = readValue(extracted.reminder_outcome ?? extracted.outcome ?? extracted.medicine_status);
  if (direct) return direct;
  for (const category of Object.values(extracted)) {
    if (!category || typeof category !== "object") continue;
    const answer = readValue((category as Record<string, unknown>).reminder_outcome);
    if (answer) return answer;
  }
  return null;
}

const SPEAKER_PATTERN = /(user|human|customer|caller|recipient|parent|assistant|agent|bot|ai|system)\s*:/gi;
const PARENT_SPEAKERS = new Set(["user", "human", "customer", "caller", "recipient", "parent"]);

// Only the parent's own turns are scanned. The agent's script itself says words
// like "help", "medicine" and "vesukunnara", so matching the whole transcript
// would misclassify nearly every call.
function parentSpeech(transcript: string): string | null {
  const matches = Array.from(transcript.matchAll(SPEAKER_PATTERN));

  if (matches.length === 0) {
    // Unrecognized transcript format - never guess from the agent's own words.
    return null;
  }

  const parts: string[] = [];

  matches.forEach((match, index) => {
    if (!PARENT_SPEAKERS.has(match[1].toLowerCase())) {
      return;
    }

    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index ?? transcript.length : transcript.length;
    parts.push(transcript.slice(start, end));
  });

  return parts.length > 0 ? parts.join(" ").toLowerCase() : null;
}

const HELP_KEYWORDS = [
  "sahayam", "bagoledu", "bagaledu", "noppi", "kallu tirugu", "ayipoyayi", "hospital",
  "help", "not feeling well", "not well", "pain", "dizzy", "chest", "fell down", "cannot breathe", "emergency",
  "సహాయం", "బాగోలేదు", "నొప్పి", "అయిపోయాయి",
  "मदद चाहिए", "तबीयत खराब", "दर्द हो रहा", "सांस नहीं", "दवा खत्म",
  "உதவி வேண்டும்", "உடம்பு சரியில்லை", "வலிக்கிறது", "மூச்சு விட முடியவில்லை",
  "ಸಹಾಯ ಬೇಕು", "ಹುಷಾರಿಲ್ಲ", "ನೋವಾಗುತ್ತಿದೆ", "ಉಸಿರಾಡಲು ಆಗುತ್ತಿಲ್ಲ"
];
const TAKEN_KEYWORDS = [
  "vesukunna", "vesukunnanu", "teesukunna", "theesukunna", "thisukunna", "ayipoyindi",
  "took it", "i took", "have taken", "already taken",
  "వేసుకున్నా", "తీసుకున్నా", "అయిపోయింది",
  "दवा ले ली", "दवाई ले ली", "दवा खा ली", "गोली ले ली",
  "மருந்து எடுத்துக்கொண்டேன்", "மாத்திரை எடுத்துக்கொண்டேன்",
  "ಔಷಧಿ ತೆಗೆದುಕೊಂಡಿದ್ದೇನೆ", "ಮಾತ್ರೆ ತೆಗೆದುಕೊಂಡಿದ್ದೇನೆ"
];
const LATER_KEYWORDS = [
  "tarvatha", "tharvatha", "kasepagi", "kasepati", "ippudu kadu", "malli cheppandi",
  "later", "not now", "in some time", "remind me",
  "తర్వాత", "కాసేపాగి", "ఇప్పుడు కాదు",
  "बाद में", "फिर याद दिला", "अभी नहीं",
  "பிறகு", "பின்னர்", "அப்புறம்", "இப்போது வேண்டாம்",
  "ಆಮೇಲೆ", "ನಂತರ", "ಈಗ ಬೇಡ"
];

// Fallback for when Bolna's extraction is unavailable or returns nothing.
// Deliberately conservative: an unrecognized answer stays unclassified and the
// caller treats it as missed, because a false "confirmed" would tell a family
// their parent took medicine when they did not.
function classifyFromTranscript(transcript: string | null | undefined): string | null {
  if (!transcript) {
    return null;
  }

  const speech = parentSpeech(transcript);

  if (!speech) {
    return null;
  }

  // Distress wins even if the parent also said they took the medicine.
  if (HELP_KEYWORDS.some((word) => speech.includes(word))) {
    return "help";
  }

  if (LATER_KEYWORDS.some((word) => speech.includes(word))) {
    return "later";
  }

  // A bare "yes" may answer a greeting, and negated statements must never
  // produce an adherence confirmation when extraction is unavailable.
  if (/\b(not|never|haven['’]?t|didn['’]?t|don['’]?t)\b/.test(speech) || /వేసుకోలేదు|తీసుకోలేదు|లేదు|नहीं|नही|मत|இல்லை|வில்லை|ಬೇಡ|ಇಲ್ಲ|ತೆಗೆದುಕೊಂಡಿಲ್ಲ/.test(speech)) {
    return null;
  }

  if (TAKEN_KEYWORDS.some((word) => speech.includes(word))) {
    return "taken";
  }

  return null;
}

export function toCallResult(payload: BolnaExecutionPayload): CallAttemptResult {
  const status = (payload.status ?? "").toLowerCase();

  if (NO_ANSWER_STATUSES.has(status) || payload.answered_by_voice_mail) {
    return {
      status: "no_answer",
      responseType: "no_response",
      notes: "Bolna call was not answered."
    };
  }

  if (FAILED_STATUSES.has(status)) {
    return {
      status: "failed",
      responseType: "no_response",
      notes: `Bolna call failed with provider status "${payload.status}".`
    };
  }

  const outcomeMap: Record<string, { status: CallAttemptResult["status"]; responseType: ResponseType; notes: string }> = {
    taken: { status: "confirmed", responseType: "speech_taken", notes: "Parent confirmed medicine was taken." },
    later: { status: "snoozed", responseType: "speech_later", notes: "Parent asked to be reminded later." },
    help: { status: "need_help", responseType: "speech_help", notes: "Parent requested help during the call." }
  };
  const extracted = extractedOutcome(payload);
  const outcome = extracted ?? classifyFromTranscript(payload.transcript);
  const mapped = outcome ? outcomeMap[outcome] : undefined;

  if (mapped) {
    const source = extracted ? "extraction" : "transcript";
    return { status: mapped.status, responseType: mapped.responseType, notes: `Bolna voice agent (${source}): ${mapped.notes}` };
  }

  return {
    status: "missed",
    responseType: "no_response",
    notes: "Call completed but the parent did not confirm taking the medicine."
  };
}
