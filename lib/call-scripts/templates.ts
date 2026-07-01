import type { DtmfInstructions, SupportedCallLanguage } from "@/lib/types";

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
  dtmf: DtmfInstructions;
  keypadLine: string;
  safetyNote: string;
};

export const supportedCallLanguages: SupportedCallLanguage[] = ["Telugu", "Hindi", "English", "Tamil", "Kannada"];

export const languageTemplates: Record<SupportedCallLanguage, LanguageTemplate> = {
  English: {
    language: "English",
    defaultAddress: "Amma",
    foodTiming: {
      before_food: "before food",
      after_food: "after food"
    },
    retryPrefix: "This is a reminder again. ",
    opening: (address) => `Hello ${address}, this is your medicine reminder.`,
    medicineLine: (medicineInstruction) => `It is time to take your ${medicineInstruction}.`,
    dtmf: {
      taken: "Press 1 if you have taken it.",
      later: "Press 2 to remind later.",
      help: "Press 3 if you need help."
    },
    keypadLine: "Please press 1 if you have taken it, press 2 to remind later, or press 3 if you need help.",
    safetyNote: "Reminder only. Follow the dosage prescribed by your doctor or caregiver."
  },
  Telugu: {
    language: "Telugu",
    defaultAddress: "Amma",
    foodTiming: {
      before_food: "food mundu",
      after_food: "food tarvatha"
    },
    retryPrefix: "Idi malli reminder. ",
    opening: (address) => `${address}, idi mee medicine reminder.`,
    medicineLine: (medicineInstruction) => `Mee ${medicineInstruction} teesukune time ayyindi.`,
    dtmf: {
      taken: "Teesukunte 1 press cheyyandi.",
      later: "Tarvatha remind cheyyali ante 2 press cheyyandi.",
      help: "Help kavali ante 3 press cheyyandi."
    },
    keypadLine: "Teesukunte 1 press cheyyandi. Tarvatha remind cheyyali ante 2 press cheyyandi. Help kavali ante 3 press cheyyandi.",
    safetyNote: "Idi reminder matrame. Doctor leda caregiver cheppina dosage follow cheyyandi."
  },
  Hindi: {
    language: "Hindi",
    defaultAddress: "Amma",
    foodTiming: {
      before_food: "khane se pehle",
      after_food: "khane ke baad"
    },
    retryPrefix: "Yeh dobara reminder hai. ",
    opening: (address) => `Namaste ${address}, yeh aapka medicine reminder hai.`,
    medicineLine: (medicineInstruction) => `Aapki ${medicineInstruction} lene ka samay ho gaya hai.`,
    dtmf: {
      taken: "Agar aapne le li hai toh 1 dabaiye.",
      later: "Baad mein yaad dilana hai toh 2 dabaiye.",
      help: "Help chahiye toh 3 dabaiye."
    },
    keypadLine: "Agar aapne le li hai toh 1 dabaiye. Baad mein yaad dilana hai toh 2 dabaiye. Help chahiye toh 3 dabaiye.",
    safetyNote: "Yeh sirf reminder hai. Doctor ya caregiver ke bataye hue dosage ko follow kijiye."
  },
  Tamil: {
    language: "Tamil",
    defaultAddress: "Amma",
    foodTiming: {
      before_food: "saapadu munnaadi",
      after_food: "saapadu apram"
    },
    retryPrefix: "Idhu marubadiyum reminder. ",
    opening: (address) => `Vanakkam ${address}, idhu unga medicine reminder.`,
    medicineLine: (medicineInstruction) => `Unga ${medicineInstruction} edukka neram aayiduchu.`,
    dtmf: {
      taken: "Eduthirundha 1 press pannunga.",
      later: "Apram remind panna 2 press pannunga.",
      help: "Help venumna 3 press pannunga."
    },
    keypadLine: "Eduthirundha 1 press pannunga. Apram remind panna 2 press pannunga. Help venumna 3 press pannunga.",
    safetyNote: "Idhu reminder mattum. Doctor allathu caregiver sonna dosage-ai follow pannunga."
  },
  Kannada: {
    language: "Kannada",
    defaultAddress: "Amma",
    foodTiming: {
      before_food: "oota modalu",
      after_food: "oota aadamele"
    },
    retryPrefix: "Idu matte reminder. ",
    opening: (address) => `Namaskara ${address}, idu nimma medicine reminder.`,
    medicineLine: (medicineInstruction) => `Nimma ${medicineInstruction} tegoloke time aagide.`,
    dtmf: {
      taken: "Tegondiddare 1 press maadi.",
      later: "Nantara remind maadbeku andre 2 press maadi.",
      help: "Help beku andre 3 press maadi."
    },
    keypadLine: "Tegondiddare 1 press maadi. Nantara remind maadbeku andre 2 press maadi. Help beku andre 3 press maadi.",
    safetyNote: "Idu reminder matra. Doctor athava caregiver helida dosage follow maadi."
  }
};
