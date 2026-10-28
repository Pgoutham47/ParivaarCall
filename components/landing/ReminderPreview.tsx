"use client";

import { useState } from "react";
import { ArrowDown, Check, Phone, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const examples = [
  {
    name: "English",
    lang: "en",
    text: "Hi Amma, it’s time for your medicine. Have you taken it?",
    response: "Yes, I’ve taken it.",
  },
  {
    name: "తెలుగు",
    lang: "te",
    text: "అమ్మా, మందు వేసుకునే సమయం అయ్యింది. వేసుకున్నారా?",
    response: "అవును, వేసుకున్నాను.",
  },
  {
    name: "हिन्दी",
    lang: "hi",
    text: "माँ, आपकी दवा लेने का समय हो गया है। आपने ले ली?",
    response: "हाँ, ले ली है।",
  },
  {
    name: "தமிழ்",
    lang: "ta",
    text: "அம்மா, மருந்து எடுக்க நேரம் ஆயிடுச்சு. எடுத்தீங்களா?",
    response: "ஆமாம், எடுத்துக்கிட்டேன்.",
  },
  {
    name: "ಕನ್ನಡ",
    lang: "kn",
    text: "ಅಮ್ಮ, ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯ ಆಗಿದೆ. ತೆಗೆದುಕೊಂಡಿರಾ?",
    response: "ಹೌದು, ತೆಗೆದುಕೊಂಡಿದ್ದೇನೆ.",
  },
];

export function ReminderPreview() {
  const [selected, setSelected] = useState(0);
  const example = examples[selected];
  return (
    <div className="relative mx-auto w-full max-w-[510px]">
      <div
        className="absolute -right-3 -top-4 size-32 rounded-full border border-[#d4ddce] sm:-right-5 sm:size-44"
        aria-hidden="true"
      />
      <div className="relative rounded-[28px] border border-[#dce3d5] bg-[#eaf0e3] p-5 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-sage-700">
            A familiar voice, every day
          </p>
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-[#9eaf78]"
          />
        </div>
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-white bg-white/75 p-4">
          <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-[#f5ede2] text-[#866247]">
            <span className="text-[9px] font-semibold">DAILY</span>
            <span className="text-sm font-semibold">8:00</span>
          </div>
          <div>
            <p className="text-sm font-semibold">Amma’s morning reminder</p>
            <p className="mt-0.5 text-xs text-sage-600">
              A phone call, built around her routine.
            </p>
          </div>
        </div>
        <div
          className="flex justify-center py-3 text-sage-400"
          aria-hidden="true"
        >
          <ArrowDown size={17} strokeWidth={1.5} />
        </div>
        <div className="overflow-hidden rounded-2xl bg-sage-800 text-white shadow-[0_16px_30px_rgba(35,75,61,.14)]">
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
            <div className="grid size-10 place-items-center rounded-full bg-white/10">
              <Phone size={18} strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium">ParivaarCall</p>
              <p className="mt-0.5 text-[11px] text-[#c2d2c6]">
                A gentle medicine reminder
              </p>
            </div>
            <div
              className="voice-wave ml-auto flex h-5 items-center gap-[3px]"
              aria-hidden="true"
            >
              {[8, 15, 22, 13, 19, 9].map((h, i) => (
                <span
                  key={i}
                  className="w-[3px] rounded-full bg-[#c6d8b7]"
                  style={{ height: h }}
                />
              ))}
            </div>
          </div>
          <div
            aria-live="polite"
            aria-atomic="true"
            className="min-h-[160px] p-5"
          >
            <p
              lang={example.lang}
              className="max-w-[290px] text-[17px] leading-7"
            >
              “{example.text}”
            </p>
            <div className="ml-auto mt-4 w-fit rounded-xl rounded-br-sm bg-white/10 px-4 py-2.5">
              <p lang={example.lang} className="text-sm text-[#e6eee1]">
                {example.response}
              </p>
            </div>
          </div>
        </div>
        <div className="relative mx-3 -mt-1 flex items-center gap-3 rounded-b-xl border-x border-b border-sage-200 bg-white px-4 py-3.5 shadow-sm sm:mx-5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sage-50 text-sage-700">
            <Check size={16} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold">
              A little reassurance for you.
            </p>
            <p className="mt-0.5 text-[11px] text-sage-600">
              Her confirmation appears in your dashboard.
            </p>
          </div>
        </div>
        <p className="mt-6 flex items-center gap-2 text-[11px] font-medium text-sage-600">
          <MessageCircle size={14} aria-hidden="true" /> Read a conversation in
          your language
        </p>
        <div
          className="mt-3 flex flex-wrap gap-1.5"
          aria-label="Example conversation language"
        >
          {examples.map((item, i) => (
            <button
              key={item.lang}
              type="button"
              lang={item.lang}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
              className={cn(
                "focus-ring min-h-10 rounded-lg px-3 text-xs font-medium transition-colors",
                selected === i
                  ? "bg-white text-sage-900 shadow-sm"
                  : "text-sage-700 hover:bg-white/60",
              )}
            >
              {item.name}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-sage-600">
          Text preview · No call is placed
        </p>
      </div>
    </div>
  );
}
