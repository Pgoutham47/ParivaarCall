export type ParentStatus = "active" | "needs_attention" | "paused" | "inactive";

export type Profile = {
  id: string;
  fullName: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Parent = {
  id: string;
  caregiverId: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  age: number | null;
  preferredLanguage: string;
  city: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  status: ParentStatus;
  createdAt: string;
  updatedAt: string;
};

export type ParentInput = {
  name: string;
  relationship: string;
  phoneNumber: string;
  age: number | null;
  preferredLanguage: string;
  city: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  status?: ParentStatus;
};

export type MealTiming = "before_food" | "after_food";
export type Frequency = "daily" | "weekly" | "custom";
export type ImportanceLevel = "routine" | "important";
export type SupportedCallLanguage = "Telugu" | "Hindi" | "English" | "Tamil" | "Kannada";

export type MedicineSchedule = {
  id: string;
  caregiverId: string;
  parentId: string;
  parentName: string;
  medicineName: string;
  dosageInstruction: string | null;
  time: string;
  mealTiming: MealTiming;
  frequency: Frequency;
  importanceLevel: ImportanceLevel;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MedicineScheduleInput = {
  parentId: string;
  medicineName: string;
  dosageInstruction: string | null;
  time: string;
  mealTiming: MealTiming;
  frequency: Frequency;
  importanceLevel: ImportanceLevel;
  startDate: string | null;
  endDate: string | null;
  isActive?: boolean;
};

export type CallStatus =
  | "pending"
  | "calling"
  | "confirmed"
  | "snoozed"
  | "no_answer"
  | "missed"
  | "failed"
  | "need_help";

export type ResponseType =
  | "dtmf_1_taken"
  | "dtmf_2_later"
  | "dtmf_3_help"
  | "speech_taken"
  | "speech_later"
  | "speech_help"
  | "no_response";

export type SimulatedCallResponse = "confirmed" | "snoozed" | "no_answer" | "missed" | "need_help";

export type CallLog = {
  id: string;
  parentName: string;
  medicine: string;
  scheduledTime: string;
  status: CallStatus;
  response: string;
  responseType: ResponseType | null;
  retryCount: number;
  createdAt: string;
  scriptText: string | null;
  scriptLanguage: SupportedCallLanguage | "English";
  shortPreviewText: string;
  safetyNote: string | null;
  audioUrl: string | null;
  audioStatus: AudioStatus;
  audioProvider: string | null;
  audioGeneratedAt: string | null;
  callProvider: string | null;
  providerCallId: string | null;
  transcript: string | null;
};

export type AlertType = "missed_medicine" | "no_answer" | "need_help" | "call_failed";
export type AlertSeverity = "low" | "medium" | "high" | "critical";

export type Alert = {
  id: string;
  type: AlertType;
  title: string;
  parentName: string;
  description: string;
  severity: AlertSeverity;
  createdAt: string;
  isRead: boolean;
};

// Voice character (gender, speed, tone) is configured on the Bolna agent, not
// here. These settings cover what is per-caregiver: which language their calls
// use, how the parent is addressed, and retry behaviour.
export type RespectMode = "formal" | "casual";

export type VoiceSettings = {
  id: string;
  caregiverId: string;
  languagePreference: string;
  respectMode: RespectMode;
  retryAttempts: number;
  retryGapMinutes: number;
  createdAt: string;
  updatedAt: string;
};

export type VoiceSettingsInput = {
  languagePreference: string;
  respectMode: RespectMode;
  retryAttempts: number;
  retryGapMinutes: number;
};

export type TodayScheduleItem = {
  id: string;
  time: string;
  parentName: string;
  medicineName: string;
  language: SupportedCallLanguage | "English";
  scriptGenerated: boolean;
  status: CallStatus | "not_generated";
};

export type CallJob = {
  callLog: {
    id: string;
    caregiver_id: string;
    parent_id: string;
    medicine_schedule_id: string | null;
    scheduled_for: string | null;
    retry_count: number;
  };
  parent: {
    id: string;
    name: string;
    phone: string;
  };
  medicineSchedule: {
    id: string;
    medicine_name: string;
    dosage_instruction: string | null;
    scheduled_time: string;
  } | null;
  script: {
    text: string | null;
    language: string | null;
  };
};

export type CallAttemptResult = {
  status: Exclude<CallStatus, "pending" | "calling">;
  responseType: ResponseType;
  notes?: string;
};

// Simulated calls complete immediately; Bolna calls are asynchronous — the
// Bolna voice agent dials out through Vobiz and reports the outcome later on
// the /api/webhooks/bolna callback.
export type CallPlacement =
  | { kind: "completed"; result: CallAttemptResult }
  | { kind: "initiated"; provider: "bolna"; providerCallId: string; notes?: string };

export type CallProvider = {
  name: "simulated" | "bolna";
  placeCall(job: CallJob, options?: { simulatedResponse?: SimulatedCallResponse }): Promise<CallPlacement>;
};

export type MedicineReminderScriptInput = {
  parentName: string;
  relationship: string | null;
  language: string | null;
  medicineName: string;
  dosageInstruction: string | null;
  foodTiming: MealTiming | string | null;
  scheduledTime: string | null;
  retryCount: number;
  respectMode?: RespectMode;
};

export type MedicineReminderScript = {
  language: SupportedCallLanguage;
  scriptText: string;
  shortPreviewText: string;
  safetyNote?: string;
};

export type AudioStatus = "not_generated" | "mock_generated" | "generated" | "failed";
