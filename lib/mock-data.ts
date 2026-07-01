import type { Alert, CallLog, MedicineSchedule, Parent, VoiceSettings } from "@/lib/types";

export const parents: Parent[] = [
  {
    id: "parent-1",
    caregiverId: "demo-caregiver",
    name: "Lakshmi Rao",
    relationship: "Mother",
    phoneNumber: "+91 98765 43210",
    age: 72,
    preferredLanguage: "Telugu",
    city: "Hyderabad",
    emergencyContactName: "Ramesh Rao",
    emergencyContactPhone: "+91 99887 76655",
    status: "active",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z"
  },
  {
    id: "parent-2",
    caregiverId: "demo-caregiver",
    name: "Harish Mehta",
    relationship: "Father",
    phoneNumber: "+91 91234 56780",
    age: 78,
    preferredLanguage: "Hindi",
    city: "Ahmedabad",
    emergencyContactName: "Neha Mehta",
    emergencyContactPhone: "+91 90000 11122",
    status: "needs_attention",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z"
  },
  {
    id: "parent-3",
    caregiverId: "demo-caregiver",
    name: "Mary Thomas",
    relationship: "Aunt",
    phoneNumber: "+91 98989 12121",
    age: 69,
    preferredLanguage: "Malayalam",
    city: "Kochi",
    emergencyContactName: "Joseph Thomas",
    emergencyContactPhone: "+91 90909 34343",
    status: "active",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z"
  }
];

export const medicineSchedules: MedicineSchedule[] = [
  {
    id: "med-1",
    caregiverId: "demo-caregiver",
    parentId: "parent-1",
    parentName: "Lakshmi Rao",
    medicineName: "Metformin",
    dosageInstruction: "1 tablet with water",
    time: "08:00",
    mealTiming: "after_food",
    frequency: "daily",
    importanceLevel: "important",
    startDate: "2026-06-01",
    endDate: null,
    isActive: true,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z"
  },
  {
    id: "med-2",
    caregiverId: "demo-caregiver",
    parentId: "parent-2",
    parentName: "Harish Mehta",
    medicineName: "Amlodipine",
    dosageInstruction: "1 tablet",
    time: "09:30",
    mealTiming: "before_food",
    frequency: "daily",
    importanceLevel: "important",
    startDate: "2026-06-05",
    endDate: null,
    isActive: true,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z"
  },
  {
    id: "med-3",
    caregiverId: "demo-caregiver",
    parentId: "parent-3",
    parentName: "Mary Thomas",
    medicineName: "Vitamin D",
    dosageInstruction: "1 capsule",
    time: "20:00",
    mealTiming: "after_food",
    frequency: "weekly",
    importanceLevel: "routine",
    startDate: "2026-06-10",
    endDate: "2026-09-10",
    isActive: true,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z"
  }
];

export const callLogs: CallLog[] = [
  {
    id: "call-1",
    parentName: "Lakshmi Rao",
    medicine: "Metformin",
    scheduledTime: "08:00",
    status: "confirmed",
    response: "Confirmed after breakfast",
    responseType: "dtmf_1_taken",
    retryCount: 0,
    createdAt: "2026-06-16T08:01:00.000Z",
    scriptText: "Hello Amma, this is your medicine reminder. It is time to take your Metformin after food. Please press 1 if you have taken it, press 2 to remind later, or press 3 if you need help.",
    scriptLanguage: "English",
    shortPreviewText: "Hello Amma, this is your medicine reminder.",
    dtmfInstructions: "Press 1 if you have taken it. Press 2 to remind later. Press 3 if you need help.",
    safetyNote: "Reminder only. Follow the dosage prescribed by your doctor or caregiver.",
    audioUrl: null,
    audioStatus: "mock_generated",
    audioProvider: "mock",
    audioGeneratedAt: "2026-06-16T08:01:10.000Z"
  },
  {
    id: "call-2",
    parentName: "Harish Mehta",
    medicine: "Amlodipine",
    scheduledTime: "09:30",
    status: "no_answer",
    response: "No response yet",
    responseType: "no_response",
    retryCount: 1,
    createdAt: "2026-06-16T09:35:00.000Z",
    scriptText: "Namaste Papa ji, yeh aapka medicine reminder hai. Aapki Amlodipine khane se pehle lene ka samay ho gaya hai. Agar aapne le li hai toh 1 dabaiye. Baad mein yaad dilana hai toh 2 dabaiye. Help chahiye toh 3 dabaiye.",
    scriptLanguage: "Hindi",
    shortPreviewText: "Namaste Papa ji, yeh aapka medicine reminder hai.",
    dtmfInstructions: "Agar aapne le li hai toh 1 dabaiye. Baad mein yaad dilana hai toh 2 dabaiye. Help chahiye toh 3 dabaiye.",
    safetyNote: "Yeh sirf reminder hai. Doctor ya caregiver ke bataye hue dosage ko follow kijiye.",
    audioUrl: null,
    audioStatus: "not_generated",
    audioProvider: null,
    audioGeneratedAt: null
  },
  {
    id: "call-3",
    parentName: "Mary Thomas",
    medicine: "Vitamin D",
    scheduledTime: "20:00",
    status: "snoozed",
    response: "Asked to call again in 15 minutes",
    responseType: "dtmf_2_later",
    retryCount: 0,
    createdAt: "2026-06-16T20:01:00.000Z",
    scriptText: "Hello Aunty, this is your medicine reminder. It is time to take your Vitamin D after food. Please press 1 if you have taken it, press 2 to remind later, or press 3 if you need help.",
    scriptLanguage: "English",
    shortPreviewText: "Hello Aunty, this is your medicine reminder.",
    dtmfInstructions: "Press 1 if you have taken it. Press 2 to remind later. Press 3 if you need help.",
    safetyNote: "Reminder only. Follow the dosage prescribed by your doctor or caregiver.",
    audioUrl: null,
    audioStatus: "not_generated",
    audioProvider: null,
    audioGeneratedAt: null
  },
  {
    id: "call-4",
    parentName: "Harish Mehta",
    medicine: "Amlodipine",
    scheduledTime: "09:45",
    status: "need_help",
    response: "Pressed help during the call",
    responseType: "dtmf_3_help",
    retryCount: 2,
    createdAt: "2026-06-16T09:48:00.000Z",
    scriptText: "Namaste Papa ji, yeh aapka medicine reminder hai. Aapki Amlodipine khane se pehle lene ka samay ho gaya hai. Agar aapne le li hai toh 1 dabaiye. Baad mein yaad dilana hai toh 2 dabaiye. Help chahiye toh 3 dabaiye.",
    scriptLanguage: "Hindi",
    shortPreviewText: "Namaste Papa ji, yeh aapka medicine reminder hai.",
    dtmfInstructions: "Agar aapne le li hai toh 1 dabaiye. Baad mein yaad dilana hai toh 2 dabaiye. Help chahiye toh 3 dabaiye.",
    safetyNote: "Yeh sirf reminder hai. Doctor ya caregiver ke bataye hue dosage ko follow kijiye.",
    audioUrl: null,
    audioStatus: "failed",
    audioProvider: "mock",
    audioGeneratedAt: "2026-06-16T09:48:10.000Z"
  }
];

export const alerts: Alert[] = [
  {
    id: "alert-1",
    type: "need_help",
    title: "Need help response",
    parentName: "Harish Mehta",
    description: "Harish requested help during the medicine confirmation call.",
    severity: "critical",
    createdAt: "Today, 9:48 AM",
    isRead: false
  },
  {
    id: "alert-2",
    type: "no_answer",
    title: "No answer after retry",
    parentName: "Harish Mehta",
    description: "The scheduled call was not answered after one retry.",
    severity: "medium",
    createdAt: "Today, 9:35 AM",
    isRead: false
  },
  {
    id: "alert-3",
    type: "missed_medicine",
    title: "Missed medicine",
    parentName: "Lakshmi Rao",
    description: "Yesterday evening medicine was not confirmed.",
    severity: "low",
    createdAt: "Yesterday, 8:30 PM",
    isRead: false
  }
];

export const voiceSettings: VoiceSettings = {
  id: "demo-settings",
  caregiverId: "demo-caregiver",
  languagePreference: "Parent preferred language",
  voiceGender: "female",
  tone: "warm",
  speechSpeed: "normal",
  respectMode: "formal",
  retryAttempts: 3,
  retryGapMinutes: 15,
  notifications: {
    whatsapp: true,
    sms: true,
    email: false
  },
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z"
};

export const todaysSchedule = [
  {
    id: "today-1",
    time: "08:00",
    parentName: "Lakshmi Rao",
    medicineName: "Metformin",
    status: "Confirmed"
  },
  {
    id: "today-2",
    time: "09:30",
    parentName: "Harish Mehta",
    medicineName: "Amlodipine",
    status: "Retry pending"
  },
  {
    id: "today-3",
    time: "20:00",
    parentName: "Mary Thomas",
    medicineName: "Vitamin D",
    status: "Scheduled"
  }
];

// TODO: Replace mock exports with Supabase queries once auth and database tables are added.
