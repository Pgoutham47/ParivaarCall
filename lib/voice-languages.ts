import { selectableCallLanguages, type RespectMode, type SupportedCallLanguage } from "@/lib/types";

export const callLanguageCodes: Record<SupportedCallLanguage, string> = {
  Telugu: "te", English: "en", Hindi: "hi", Tamil: "ta", Kannada: "kn"
};

export function resolveCallLanguage(preference: string, parentLanguage: string): SupportedCallLanguage {
  const value = preference === "Parent preferred language" ? parentLanguage : preference;
  const language = selectableCallLanguages.find((item) => item.toLowerCase() === value.trim().toLowerCase());
  if (!language) throw new Error("This call language is not configured.");
  return language;
}

// A short introduction has one question only, so a greeting's "yes" cannot be
// mistaken for confirming medicine. Formal addresses use the person's name;
// warm addresses use the family relationship without impersonating the child.
export function reminderOpening(language: SupportedCallLanguage, name: string, address: string, mode: RespectMode = "formal") {
  const formal = mode === "formal";
  switch (language) {
    case "Telugu": return formal ? `నమస్కారం ${name} గారు. ఇది పరివార్ కాల్ మందుల రిమైండర్.` : `${address}, పరివార్ కాల్ నుంచి మందుల గురించి గుర్తు చేస్తున్నాం.`;
    case "Hindi": return formal ? `नमस्ते ${name} जी। यह परिवार कॉल की दवा की याद दिलाने वाली कॉल है।` : `नमस्ते ${address}। परिवार कॉल से आपकी दवा याद दिलाने के लिए फ़ोन है।`;
    case "Tamil": return formal ? `வணக்கம் ${name}. இது பரிவார் கால் மருந்து நினைவூட்டல் அழைப்பு.` : `வணக்கம் ${address}. பரிவார் காலிலிருந்து மருந்தை நினைவூட்ட அழைக்கிறோம்.`;
    case "Kannada": return formal ? `ನಮಸ್ಕಾರ ${name} ಅವರೇ. ಇದು ಪರಿವಾರ್ ಕಾಲ್ ಔಷಧಿಯ ಜ್ಞಾಪನೆ ಕರೆ.` : `ನಮಸ್ಕಾರ ${address}. ಪರಿವಾರ್ ಕಾಲ್‌ನಿಂದ ಔಷಧಿಯನ್ನು ನೆನಪಿಸಲು ಕರೆ ಮಾಡುತ್ತಿದ್ದೇವೆ.`;
    case "English": return formal ? `Hello ${name}. This is your ParivaarCall medicine reminder.` : `Hello ${address}. ParivaarCall here with a gentle medicine reminder.`;
  }
}

export const testCallScripts: Record<SupportedCallLanguage, string> = {
  Telugu: "నమస్కారం! ఇది పరివార్ కాల్ పరీక్ష కాల్. నిజంగా మందు తీసుకోవాల్సిన అవసరం లేదు. పరీక్ష కోసం, మందు వేసుకున్నాను అని చెప్పగలరా?",
  English: "Hello! This is a ParivaarCall test call. You do not need to take any medicine. For this test, could you say: I have taken it?",
  Hindi: "नमस्ते! यह परिवार कॉल की टेस्ट कॉल है। आपको सच में कोई दवा लेने की ज़रूरत नहीं है। टेस्ट के लिए, क्या आप कह सकते हैं: मैंने दवा ले ली है?",
  Tamil: "வணக்கம்! இது பரிவார் கால் சோதனை அழைப்பு. உண்மையில் எந்த மருந்தும் எடுக்க வேண்டாம். சோதனைக்காக, மருந்து எடுத்துக்கொண்டேன் என்று சொல்ல முடியுமா?",
  Kannada: "ನಮಸ್ಕಾರ! ಇದು ಪರಿವಾರ್ ಕಾಲ್ ಪರೀಕ್ಷಾ ಕರೆ. ನಿಜವಾಗಿ ಯಾವುದೇ ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳಬೇಕಾಗಿಲ್ಲ. ಪರೀಕ್ಷೆಗಾಗಿ, ಔಷಧಿ ತೆಗೆದುಕೊಂಡಿದ್ದೇನೆ ಎಂದು ಹೇಳಬಹುದೇ?"
};
