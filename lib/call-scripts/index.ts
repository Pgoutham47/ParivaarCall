import type {
  MealTiming,
  MedicineReminderScript,
  MedicineReminderScriptInput,
  RespectMode,
  SupportedCallLanguage
} from "@/lib/types";
import { languageTemplates, supportedCallLanguages, type LanguageTemplate } from "@/lib/call-scripts/templates";

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

// Caregivers pick the relationship from a dropdown, but older rows and free
// text still arrive in several spellings, so each kind is matched on keywords.
const RELATIONSHIP_KEYWORDS: ReadonlyArray<readonly [keyof LanguageTemplate["address"], readonly string[]]> = [
  ["father", ["father", "dad", "appa", "nanna", "papa"]],
  ["mother", ["mother", "mom", "amma", "mummy"]],
  ["uncle", ["uncle", "mama", "chacha"]],
  ["aunt", ["aunt", "attha", "chithi"]]
];

export function getRelationshipAddress(
  relationship: string | null | undefined,
  language: string | null | undefined,
  respectMode: RespectMode = "formal"
) {
  const normalizedRelationship = relationship?.trim().toLowerCase() ?? "";
  const template = getLanguageTemplate(language);
  const match = RELATIONSHIP_KEYWORDS.find(([, keywords]) =>
    keywords.some((keyword) => normalizedRelationship.includes(keyword))
  );

  if (!match) {
    return template.address.fallback;
  }

  const address = template.address[match[0]];

  // `fallback` is a plain string; the four relationship entries are objects.
  return typeof address === "string" ? address : address[respectMode];
}

// Food timing is already carried by the schedule's structured food_timing field,
// so a caregiver also typing it into the dosage box would have it spoken twice -
// and if the two disagree ("after food" typed, "before food" selected) the parent
// hears a contradiction. The structured field wins; this strips the duplicate.
const FOOD_TIMING_IN_DOSAGE = /\b(before|after)\s+(food|meals?|eating)\b/gi;

// Rewrites the English dosage a caregiver typed ("1 tablet with water") into the
// call language ("oka tablet neelltho"). Unrecognized words - brand names, "500
// mg", or dosage already written in the local language - pass through unchanged.
export function localizeDosageInstruction(dosage: string, template: LanguageTemplate) {
  return template.dosagePhrases
    .reduce(
      (text, [english, local]) => text.replace(new RegExp(`\\b${escapeRegExp(english)}\\b`, "gi"), local),
      dosage.replace(FOOD_TIMING_IN_DOSAGE, "")
    )
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  const rawDosage = medicineSchedule.dosageInstruction?.trim();
  const dosageInstruction = rawDosage ? localizeDosageInstruction(rawDosage, template) : rawDosage;
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
  const scriptText = [
    `${retryPrefix}${template.opening(address)}`,
    template.medicineLine(medicineInstruction),
    template.closingQuestion
  ].join(" ");

  return {
    language: template.language,
    scriptText,
    shortPreviewText: `${template.opening(address)} ${template.medicineLine(medicineInstruction)}`,
    safetyNote: template.safetyNote
  };
}
