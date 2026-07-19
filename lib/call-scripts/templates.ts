import type { SupportedCallLanguage } from "@/lib/types";

export type LanguageTemplate = {
  language: SupportedCallLanguage;
  defaultAddress: string;
  foodTiming: {
    before_food: string;
    after_food: string;
  };
  retryPrefix: string;
  opening(address: string): string;
  medicineLine(medicineInstruction: string): string;
  closingQuestion: string;
  safetyNote: string;
  // Caregivers type dosage in English ("1 tablet with water"), which lands
  // awkwardly inside a Telugu or Tamil sentence. These rewrite the common
  // patterns into the call language. Ordered longest-phrase-first, since they
  // are applied in sequence. Anything unmatched passes through untouched.
  dosagePhrases: ReadonlyArray<readonly [string, string]>;
};

export const supportedCallLanguages: SupportedCallLanguage[] = ["Telugu", "Hindi", "English", "Tamil", "Kannada"];

// Scripts are written the way a family member would actually speak on the phone:
// a short greeting, one plain sentence about the medicine, one direct question.
// The voice agent converses from here, so there are no keypad instructions.
export const languageTemplates: Record<SupportedCallLanguage, LanguageTemplate> = {
  English: {
    language: "English",
    defaultAddress: "Amma",
    foodTiming: {
      before_food: "before food",
      after_food: "after food"
    },
    retryPrefix: "I am calling again. ",
    opening: (address) => `Hello ${address}, how are you?`,
    medicineLine: (medicineInstruction) => `It is time for your ${medicineInstruction}.`,
    closingQuestion: "Have you taken it?",
    safetyNote: "Reminder only. Follow the dosage prescribed by your doctor or caregiver.",
    dosagePhrases: []
  },
  Telugu: {
    language: "Telugu",
    defaultAddress: "Amma",
    foodTiming: {
      before_food: "food mundu",
      after_food: "food tarvatha"
    },
    retryPrefix: "Malli okasari phone chestunnanu. ",
    opening: (address) => `${address}, bagunnara?`,
    medicineLine: (medicineInstruction) => `Mee ${medicineInstruction} vesukune time ayyindi.`,
    closingQuestion: "Vesukunnara?",
    safetyNote: "Idi reminder matrame. Doctor leda caregiver cheppina dosage follow cheyyandi.",
    dosagePhrases: [
      ["with warm water", "vedi neelltho"],
      ["with water", "neelltho"],
      ["with milk", "paalatho"],
      ["with food", "food tho"],
      ["empty stomach", "khaali kadupu tho"],
      ["one and half", "okatinnara"],
      ["half", "sagam"],
      ["twice", "rendu sarlu"],
      ["drops", "chukkalu"],
      ["drop", "chukka"],
      ["spoons", "spoonlu"],
      ["tablets", "tabletlu"],
      ["one", "oka"],
      ["two", "rendu"],
      ["three", "moodu"],
      ["1", "oka"],
      ["2", "rendu"],
      ["3", "moodu"]
    ]
  },
  Hindi: {
    language: "Hindi",
    defaultAddress: "Amma",
    foodTiming: {
      before_food: "khane se pehle",
      after_food: "khane ke baad"
    },
    retryPrefix: "Main dobara phone kar raha hoon. ",
    opening: (address) => `Namaste ${address}, aap kaise hain?`,
    medicineLine: (medicineInstruction) => `Aapki ${medicineInstruction} lene ka time ho gaya hai.`,
    closingQuestion: "Aapne le li?",
    safetyNote: "Yeh sirf reminder hai. Doctor ya caregiver ke bataye hue dosage ko follow kijiye.",
    dosagePhrases: [
      ["with warm water", "garam paani ke saath"],
      ["with water", "paani ke saath"],
      ["with milk", "doodh ke saath"],
      ["with food", "khane ke saath"],
      ["empty stomach", "khaali pet"],
      ["one and half", "dedh"],
      ["half", "aadha"],
      ["twice", "do baar"],
      ["drops", "boond"],
      ["drop", "boond"],
      ["spoons", "chammach"],
      ["spoon", "chammach"],
      ["one", "ek"],
      ["two", "do"],
      ["three", "teen"],
      ["1", "ek"],
      ["2", "do"],
      ["3", "teen"]
    ]
  },
  Tamil: {
    language: "Tamil",
    defaultAddress: "Amma",
    foodTiming: {
      before_food: "saapadu munnaadi",
      after_food: "saapadu apram"
    },
    retryPrefix: "Marubadiyum phone panren. ",
    opening: (address) => `Vanakkam ${address}, eppadi irukeenga?`,
    medicineLine: (medicineInstruction) => `Unga ${medicineInstruction} edukka neram aayiduchu.`,
    closingQuestion: "Eduthingala?",
    safetyNote: "Idhu reminder mattum. Doctor allathu caregiver sonna dosage-ai follow pannunga.",
    dosagePhrases: [
      ["with warm water", "sudu thanni-yoda"],
      ["with water", "thanni-yoda"],
      ["with milk", "paal-oda"],
      ["with food", "saapattoda"],
      ["empty stomach", "veruma vayitrula"],
      ["one and half", "onnarai"],
      ["half", "paadhi"],
      ["twice", "rendu thadava"],
      ["drops", "sotthukkal"],
      ["drop", "sotthu"],
      ["one", "oru"],
      ["two", "rendu"],
      ["three", "moonu"],
      ["1", "oru"],
      ["2", "rendu"],
      ["3", "moonu"]
    ]
  },
  Kannada: {
    language: "Kannada",
    defaultAddress: "Amma",
    foodTiming: {
      before_food: "oota modalu",
      after_food: "oota aadamele"
    },
    retryPrefix: "Matte phone maadtidini. ",
    opening: (address) => `Namaskara ${address}, hegiddira?`,
    medicineLine: (medicineInstruction) => `Nimma ${medicineInstruction} tegoloke time aagide.`,
    closingQuestion: "Tegondira?",
    safetyNote: "Idu reminder matra. Doctor athava caregiver helida dosage follow maadi.",
    dosagePhrases: [
      ["with warm water", "bisi neeru jothe"],
      ["with water", "neeru jothe"],
      ["with milk", "haalu jothe"],
      ["with food", "oota jothe"],
      ["empty stomach", "khaali hotte"],
      ["one and half", "ondhuvare"],
      ["half", "ardha"],
      ["twice", "eradu sala"],
      ["drops", "hanigalu"],
      ["drop", "hani"],
      ["one", "ondu"],
      ["two", "eradu"],
      ["three", "mooru"],
      ["1", "ondu"],
      ["2", "eradu"],
      ["3", "mooru"]
    ]
  }
};
