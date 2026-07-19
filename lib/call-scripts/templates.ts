import type { SupportedCallLanguage } from "@/lib/types";

export type RelationshipAddress = {
  formal: string;
  casual: string;
};

export type LanguageTemplate = {
  language: SupportedCallLanguage;
  // How the parent is addressed. Kept per language because the words differ by
  // more than spelling: a Telugu father is నాన్న, a Tamil father is அப்பா.
  address: {
    mother: RelationshipAddress;
    father: RelationshipAddress;
    aunt: RelationshipAddress;
    uncle: RelationshipAddress;
    fallback: string;
  };
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
//
// Every non-English script is written in its own native script, never
// romanized. Indic text-to-speech voices derive their rhythm and stress from
// the native script; fed Latin transliteration ("vesukunnara") they have to
// guess the pronunciation, which is what makes a call sound robotic. Medicine
// names are left as the caregiver typed them, because families do say brand
// names in English.
export const languageTemplates: Record<SupportedCallLanguage, LanguageTemplate> = {
  English: {
    language: "English",
    address: {
      mother: { formal: "Amma", casual: "Amma" },
      father: { formal: "Appa", casual: "Appa" },
      aunt: { formal: "Aunty", casual: "Aunty" },
      uncle: { formal: "Uncle", casual: "Uncle" },
      fallback: "Amma"
    },
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
    address: {
      mother: { formal: "అమ్మా", casual: "అమ్మా" },
      // Telugu for father is నాన్న. "Appa" is Tamil and Kannada.
      father: { formal: "నాన్నా", casual: "నాన్నా" },
      aunt: { formal: "అత్తయ్యా", casual: "అత్తయ్యా" },
      uncle: { formal: "మామయ్యా", casual: "మామయ్యా" },
      fallback: "అమ్మా"
    },
    foodTiming: {
      before_food: "భోజనానికి ముందు",
      after_food: "భోజనం తర్వాత"
    },
    retryPrefix: "మళ్లీ ఒకసారి ఫోన్ చేస్తున్నాను. ",
    opening: (address) => `${address}, బాగున్నారా?`,
    medicineLine: (medicineInstruction) => `మీ ${medicineInstruction} వేసుకునే సమయం అయ్యింది.`,
    closingQuestion: "వేసుకున్నారా?",
    safetyNote: "ఇది కేవలం రిమైండర్ మాత్రమే. డాక్టర్ లేదా కుటుంబ సభ్యులు చెప్పిన మోతాదునే పాటించండి.",
    dosagePhrases: [
      ["with warm water", "వేడి నీళ్లతో"],
      ["with water", "నీళ్లతో"],
      ["with milk", "పాలతో"],
      ["with food", "భోజనంతో"],
      ["empty stomach", "ఖాళీ కడుపుతో"],
      ["one and half", "ఒకటిన్నర"],
      ["half", "సగం"],
      ["twice", "రెండుసార్లు"],
      ["drops", "చుక్కలు"],
      ["drop", "చుక్క"],
      ["spoons", "చెంచాలు"],
      ["spoon", "చెంచా"],
      ["tablets", "టాబ్లెట్లు"],
      ["tablet", "టాబ్లెట్"],
      ["one", "ఒక"],
      ["two", "రెండు"],
      ["three", "మూడు"],
      ["1", "ఒక"],
      ["2", "రెండు"],
      ["3", "మూడు"]
    ]
  },
  Hindi: {
    language: "Hindi",
    address: {
      mother: { formal: "अम्मा जी", casual: "अम्मा" },
      father: { formal: "पापा जी", casual: "पापा" },
      aunt: { formal: "आंटी जी", casual: "आंटी" },
      uncle: { formal: "अंकल जी", casual: "अंकल" },
      fallback: "अम्मा जी"
    },
    foodTiming: {
      before_food: "खाने से पहले",
      after_food: "खाने के बाद"
    },
    retryPrefix: "मैं दोबारा फ़ोन कर रहा हूँ। ",
    opening: (address) => `नमस्ते ${address}, आप कैसे हैं?`,
    medicineLine: (medicineInstruction) => `आपकी ${medicineInstruction} लेने का समय हो गया है।`,
    closingQuestion: "आपने ले ली?",
    safetyNote: "यह सिर्फ़ रिमाइंडर है। डॉक्टर या परिवार के बताए हुए डोज़ का पालन कीजिए।",
    dosagePhrases: [
      ["with warm water", "गरम पानी के साथ"],
      ["with water", "पानी के साथ"],
      ["with milk", "दूध के साथ"],
      ["with food", "खाने के साथ"],
      ["empty stomach", "खाली पेट"],
      ["one and half", "डेढ़"],
      ["half", "आधा"],
      ["twice", "दो बार"],
      ["drops", "बूँदें"],
      ["drop", "बूँद"],
      ["spoons", "चम्मच"],
      ["spoon", "चम्मच"],
      ["tablets", "गोलियाँ"],
      ["tablet", "गोली"],
      ["one", "एक"],
      ["two", "दो"],
      ["three", "तीन"],
      ["1", "एक"],
      ["2", "दो"],
      ["3", "तीन"]
    ]
  },
  Tamil: {
    language: "Tamil",
    address: {
      mother: { formal: "அம்மா", casual: "அம்மா" },
      father: { formal: "அப்பா", casual: "அப்பா" },
      aunt: { formal: "அத்தை", casual: "அத்தை" },
      uncle: { formal: "மாமா", casual: "மாமா" },
      fallback: "அம்மா"
    },
    foodTiming: {
      before_food: "சாப்பாட்டுக்கு முன்",
      after_food: "சாப்பாட்டுக்கு பிறகு"
    },
    retryPrefix: "மறுபடியும் ஃபோன் பண்றேன். ",
    opening: (address) => `வணக்கம் ${address}, எப்படி இருக்கீங்க?`,
    medicineLine: (medicineInstruction) => `உங்க ${medicineInstruction} எடுக்க நேரம் ஆயிடுச்சு.`,
    closingQuestion: "எடுத்தீங்களா?",
    safetyNote: "இது நினைவூட்டல் மட்டும். டாக்டர் அல்லது குடும்பத்தினர் சொன்ன அளவைப் பின்பற்றுங்கள்.",
    dosagePhrases: [
      ["with warm water", "சூடான தண்ணீருடன்"],
      ["with water", "தண்ணீருடன்"],
      ["with milk", "பாலுடன்"],
      ["with food", "சாப்பாட்டுடன்"],
      ["empty stomach", "வெறும் வயிற்றில்"],
      ["one and half", "ஒன்றரை"],
      ["half", "பாதி"],
      ["twice", "இரண்டு முறை"],
      ["drops", "சொட்டுகள்"],
      ["drop", "சொட்டு"],
      ["spoons", "ஸ்பூன்"],
      ["spoon", "ஸ்பூன்"],
      ["tablets", "மாத்திரைகள்"],
      ["tablet", "மாத்திரை"],
      ["one", "ஒரு"],
      ["two", "இரண்டு"],
      ["three", "மூன்று"],
      ["1", "ஒரு"],
      ["2", "இரண்டு"],
      ["3", "மூன்று"]
    ]
  },
  Kannada: {
    language: "Kannada",
    address: {
      mother: { formal: "ಅಮ್ಮ", casual: "ಅಮ್ಮ" },
      father: { formal: "ಅಪ್ಪ", casual: "ಅಪ್ಪ" },
      aunt: { formal: "ಚಿಕ್ಕಮ್ಮ", casual: "ಚಿಕ್ಕಮ್ಮ" },
      uncle: { formal: "ಮಾವ", casual: "ಮಾವ" },
      fallback: "ಅಮ್ಮ"
    },
    foodTiming: {
      before_food: "ಊಟಕ್ಕೆ ಮೊದಲು",
      after_food: "ಊಟದ ನಂತರ"
    },
    retryPrefix: "ಮತ್ತೆ ಫೋನ್ ಮಾಡ್ತಿದ್ದೀನಿ. ",
    opening: (address) => `ನಮಸ್ಕಾರ ${address}, ಹೇಗಿದ್ದೀರಾ?`,
    medicineLine: (medicineInstruction) => `ನಿಮ್ಮ ${medicineInstruction} ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯ ಆಗಿದೆ.`,
    closingQuestion: "ತೆಗೆದುಕೊಂಡಿರಾ?",
    safetyNote: "ಇದು ಕೇವಲ ಜ್ಞಾಪನೆ. ಡಾಕ್ಟರ್ ಅಥವಾ ಕುಟುಂಬದವರು ಹೇಳಿದ ಪ್ರಮಾಣವನ್ನೇ ಪಾಲಿಸಿ.",
    dosagePhrases: [
      ["with warm water", "ಬಿಸಿ ನೀರಿನ ಜೊತೆ"],
      ["with water", "ನೀರಿನ ಜೊತೆ"],
      ["with milk", "ಹಾಲಿನ ಜೊತೆ"],
      ["with food", "ಊಟದ ಜೊತೆ"],
      ["empty stomach", "ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ"],
      ["one and half", "ಒಂದೂವರೆ"],
      ["half", "ಅರ್ಧ"],
      ["twice", "ಎರಡು ಬಾರಿ"],
      ["drops", "ಹನಿಗಳು"],
      ["drop", "ಹನಿ"],
      ["spoons", "ಚಮಚ"],
      ["spoon", "ಚಮಚ"],
      ["tablets", "ಮಾತ್ರೆಗಳು"],
      ["tablet", "ಮಾತ್ರೆ"],
      ["one", "ಒಂದು"],
      ["two", "ಎರಡು"],
      ["three", "ಮೂರು"],
      ["1", "ಒಂದು"],
      ["2", "ಎರಡು"],
      ["3", "ಮೂರು"]
    ]
  }
};
