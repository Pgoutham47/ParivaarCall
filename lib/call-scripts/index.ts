import type {
  MealTiming,
  MedicineReminderScript,
  MedicineReminderScriptInput,
  RespectMode,
  SupportedCallLanguage
} from "@/lib/types";
import { languageTemplates, supportedCallLanguages } from "@/lib/call-scripts/templates";

function normalizeLanguage(language: string | null | undefined): SupportedCallLanguage {
  const normalized = supportedCallLanguages.find((candidate) => candidate.toLowerCase() === language?.trim().toLowerCase());

  if (!normalized) {
    if (language && language !== "Parent preferred language") {
      console.warn(`Unsupported call script language "${language}". Falling back to English.`);
    }
    return "English";
  }

  return normalized;
}

export function getLanguageTemplate(language: string | null | undefined) {
  return languageTemplates[normalizeLanguage(language)];
}

export function getRelationshipAddress(
  relationship: string | null | undefined,
  language: string | null | undefined,
  respectMode: RespectMode = "formal"
) {
  const normalizedRelationship = relationship?.trim().toLowerCase() ?? "";
  const normalizedLanguage = normalizeLanguage(language);

  if (respectMode === "casual") {
    if (normalizedRelationship.includes("father") || normalizedRelationship.includes("dad") || normalizedRelationship.includes("appa")) {
      return normalizedLanguage === "Hindi" ? "Papa" : "Appa";
    }

    if (normalizedRelationship.includes("aunt")) {
      return normalizedLanguage === "English" ? "Aunty" : "Amma";
    }

    return "Amma";
  }

  if (normalizedRelationship.includes("father") || normalizedRelationship.includes("dad") || normalizedRelationship.includes("appa")) {
    return normalizedLanguage === "Hindi" ? "Papa ji" : "Appa";
  }

  if (normalizedRelationship.includes("mother") || normalizedRelationship.includes("mom") || normalizedRelationship.includes("amma")) {
    return normalizedLanguage === "Hindi" ? "Amma ji" : "Amma";
  }

  if (normalizedRelationship.includes("uncle")) {
    return normalizedLanguage === "English" ? "Uncle" : "Appa";
  }

  if (normalizedRelationship.includes("aunt")) {
    return normalizedLanguage === "English" ? "Aunty" : "Amma";
  }

  return getLanguageTemplate(normalizedLanguage).defaultAddress;
}

export function formatMedicineInstruction(
  medicineSchedule: {
    medicineName: string;
    dosageInstruction?: string | null;
    foodTiming?: MealTiming | string | null;
  },
  language: string | null | undefined
) {
  const template = getLanguageTemplate(language);
  const medicineName = medicineSchedule.medicineName.trim();
  const dosageInstruction = medicineSchedule.dosageInstruction?.trim();
  const foodTiming = medicineSchedule.foodTiming === "before_food" || medicineSchedule.foodTiming === "after_food"
    ? template.foodTiming[medicineSchedule.foodTiming]
    : null;

  return [medicineName, dosageInstruction, foodTiming].filter(Boolean).join(" ");
}

export function generateMedicineReminderScript(input: MedicineReminderScriptInput): MedicineReminderScript {
  const template = getLanguageTemplate(input.language);
  const address = getRelationshipAddress(input.relationship, template.language, input.respectMode);
  const medicineInstruction = formatMedicineInstruction(
    {
      medicineName: input.medicineName,
      dosageInstruction: input.dosageInstruction,
      foodTiming: input.foodTiming
    },
    template.language
  );
  const retryPrefix = input.retryCount > 0 ? template.retryPrefix : "";
  const tonePrefix = input.voiceTone === "calm" ? "" : "";
  const scriptText = [
    `${retryPrefix}${tonePrefix}${template.opening(address)}`,
    template.medicineLine(medicineInstruction),
    template.keypadLine
  ].join(" ");

  return {
    language: template.language,
    scriptText,
    ssmlText: `<speak>${scriptText}</speak>`,
    shortPreviewText: `${template.opening(address)} ${template.medicineLine(medicineInstruction)}`,
    dtmfInstructions: template.dtmf,
    safetyNote: template.safetyNote
  };
}
