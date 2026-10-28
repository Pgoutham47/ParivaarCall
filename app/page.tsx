import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  Globe2,
  Heart,
  Languages,
  Phone,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ReminderPreview } from "@/components/landing/ReminderPreview";

const steps = [
  {
    number: "01",
    title: "Bring your family closer",
    text: "Add your parent’s details, phone number, and the language they feel most comfortable speaking.",
  },
  {
    number: "02",
    title: "Make room for a routine",
    text: "Add their prescribed medicines and reminder times. Choose the speaking style and follow-up preferences.",
  },
  {
    number: "03",
    title: "Let a gentle call check in",
    text: "Your parent receives a reminder call. You can see their response and follow up when they need you.",
  },
];
const faqs = [
  {
    question: "Does my parent need a smartphone?",
    answer:
      "No. Your parent receives a regular phone call on their existing number. They don’t need to download an app, create an account, or use the internet. You manage reminders from your own dashboard.",
  },
  {
    question: "Which languages can the calls use?",
    answer:
      "Telugu, English, Hindi, Tamil, and Kannada. You can use each parent’s preferred language or set one language for the account. Your parent can also ask to switch between these languages during a call.",
  },
  {
    question: "What if my parent doesn’t answer?",
    answer:
      "You can set how many times to retry and the gap between attempts. The dashboard shows call outcomes and alerts that need your attention. Retries stop at the end of the reminder day.",
  },
  {
    question: "Can I start calling any number immediately?",
    answer:
      "Calling currently uses free-tier services and is limited to numbers verified for your account. You can set up your family and reminders first. Your account administrator must arrange number verification before live calls can begin.",
  },
  {
    question: "Does ParivaarCall provide medical advice?",
    answer:
      "ParivaarCall reminds your parent about the medicine and dosage you enter. It does not prescribe, change a dosage, or provide emergency care. Follow the advice of your parent’s medical professional.",
  },
];

export default function LandingPage() {
  return (
    <div className="overflow-x-clip bg-care-cream">
      <a
        href="#main-content"
        className="skip-link focus-ring rounded-xl bg-white px-4 py-3 text-sm font-semibold"
      >
        Skip to content
      </a>
      <header className="section-wrap flex h-[88px] items-center justify-between gap-4">
        <Link
          href="/"
          aria-label="ParivaarCall home"
          className="focus-ring shrink-0 rounded-lg"
        >
          <BrandLogo priority className="!w-[172px] sm:!w-[200px]" />
        </Link>
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-7 text-[13px] font-medium text-sage-700 md:flex"
        >
          <Link
            href="#how-it-works"
            className="focus-ring rounded hover:text-sage-900"
          >
            How it works
          </Link>
          <Link
            href="#languages"
            className="focus-ring rounded hover:text-sage-900"
          >
            Made for your family
          </Link>
          <Link
            href="#questions"
            className="focus-ring rounded hover:text-sage-900"
          >
            Questions
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/login"
            className="focus-ring rounded-lg px-2 py-3 text-sm font-medium text-sage-800"
          >
            Log in
          </Link>
          <LinkButton
            href="/signup"
            size="sm"
            className="hidden sm:inline-flex"
          >
            Get started <ArrowRight size={14} aria-hidden="true" />
          </LinkButton>
        </div>
      </header>

      <main id="main-content">
        <section className="section-wrap grid items-center gap-12 pb-14 pt-8 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-20 lg:pt-12">
          <div>
            <p className="mb-6 flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[.16em] text-sage-700">
              <span
                className="size-1.5 rounded-full bg-[#bf7b5d]"
                aria-hidden="true"
              />{" "}
              Care, even from a distance
            </p>
            <h1 className="font-display text-[48px] leading-[1.06] tracking-[-.04em] text-sage-900 sm:text-[64px] lg:text-[68px]">
              A little reminder.
              <br />
              <span className="italic text-[#66815f]">A lot of love.</span>
            </h1>
            <p className="mt-6 max-w-[430px] text-[16px] leading-[1.85] text-sage-600">
              Medicine reminder calls for your parents, in the language that
              feels like home. Stay close to their daily routine, wherever life
              takes you.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <LinkButton href="/signup" size="lg">
                Start caring <ArrowRight size={16} aria-hidden="true" />
              </LinkButton>
              <Link
                href="#how-it-works"
                className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-xl px-2 text-sm font-medium text-sage-800"
              >
                See how it works <ArrowDown size={15} aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-2 text-xs text-sage-600">
              <Check size={15} className="text-sage-700" aria-hidden="true" />
              <span>No app for parents. Just a familiar phone call.</span>
            </div>
          </div>
          <ReminderPreview />
        </section>

        <div className="border-y border-[#e5e7dc] bg-white/40">
          <div className="section-wrap grid gap-5 py-6 sm:grid-cols-3 sm:gap-8">
            {[
              {
                icon: Phone,
                title: "A regular phone call",
                text: "Familiar for your parents",
              },
              {
                icon: Languages,
                title: "Five familiar languages",
                text: "Care that feels like home",
              },
              {
                icon: Heart,
                title: "Built around your family",
                text: "You stay part of the routine",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-center gap-3.5">
                <Icon
                  size={22}
                  strokeWidth={1.5}
                  className="shrink-0 text-sage-700"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-semibold text-sage-800">{title}</p>
                  <p className="mt-0.5 text-xs text-sage-600">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <section id="how-it-works" className="section-wrap py-20 sm:py-24">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">A simpler way to care</p>
              <h2 className="mt-4 font-display text-4xl leading-tight tracking-[-.025em] text-sage-900 sm:text-[44px]">
                Their routine.
                <br />
                Your peace of mind.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-sage-600">
              You can’t always be there for every little thing.
              <br className="hidden sm:block" /> A thoughtful reminder can help
              bridge the distance.
            </p>
          </div>
          <div className="mt-12 grid gap-9 md:grid-cols-3 md:gap-8">
            {steps.map((step) => (
              <div key={step.number} className="border-t border-sage-200 pt-6">
                <span className="font-display text-2xl text-[#a6b09b]">
                  {step.number}
                </span>
                <h3 className="mt-5 text-[17px] font-semibold tracking-tight text-sage-900">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-xs text-sm leading-7 text-sage-600">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="languages" className="section-wrap pb-20 sm:pb-24">
          <div className="grid overflow-hidden rounded-[24px] bg-[#edf1e7] lg:grid-cols-2">
            <div className="p-7 sm:p-10 lg:p-12">
              <p className="eyebrow">Familiar words. Thoughtful care.</p>
              <h2 className="mt-5 font-display text-4xl leading-[1.15] tracking-[-.025em] text-sage-900">
                It feels better
                <br />
                in their own language.
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-7 text-sage-600">
                A reminder should feel easy to understand. Choose their language
                and a warm or formal speaking style. They can respond naturally
                during the call.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {["తెలుగు", "English", "हिन्दी", "தமிழ்", "ಕನ್ನಡ"].map(
                  (language, i) => (
                    <span
                      key={language}
                      lang={["te", "en", "hi", "ta", "kn"][i]}
                      className="rounded-full border border-[#ced8c7] px-3.5 py-2 text-sm text-sage-800"
                    >
                      {language}
                    </span>
                  ),
                )}
              </div>
              <Link
                href="/signup"
                className="focus-ring mt-8 inline-flex items-center gap-2 rounded text-sm font-semibold text-sage-800"
              >
                Set up your family <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
            <div className="flex items-center justify-center border-t border-[#dce3d5] bg-[#e2eadc] p-7 sm:p-10 lg:border-l lg:border-t-0">
              <div className="w-full max-w-sm rounded-2xl border border-white/80 bg-white p-6 shadow-[0_10px_40px_rgba(44,72,49,.06)]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    Your family, at a glance
                  </p>
                  <span className="rounded bg-sage-50 px-2 py-1 text-[10px] text-sage-600">
                    Example
                  </span>
                </div>
                <p className="mt-1 text-xs text-sage-600">
                  The moments that matter, in one place.
                </p>
                <div className="mt-6 flex items-center gap-3 border-b border-sage-100 pb-5">
                  <span className="grid size-11 place-items-center rounded-full bg-[#f4e6da] font-display text-xl text-[#8b6246]">
                    A
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Amma</p>
                    <p className="mt-1 text-xs text-sage-600">
                      Morning medicine · 8:00 AM
                    </p>
                  </div>
                  <CheckCheck
                    size={20}
                    className="ml-auto text-sage-700"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-5 flex items-start gap-3">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-sage-50 text-sage-700">
                    <Check size={14} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">
                      She’s confirmed her medicine.
                    </p>
                    <p className="mt-1 text-xs leading-5 text-sage-600">
                      A small update that makes the distance feel a little
                      smaller.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-2 border-t border-sage-100 pt-4 text-[11px] text-sage-600">
                  <Clock3 size={13} aria-hidden="true" /> Follow call outcomes
                  and missed reminders
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-wrap pb-20 sm:pb-24">
          <div className="grid gap-10 md:grid-cols-[.8fr_1.2fr] md:gap-20">
            <div>
              <p className="eyebrow">More clarity. Less checking in.</p>
              <h2 className="mt-4 font-display text-4xl leading-tight tracking-[-.025em] text-sage-900">
                Know when they
                <br />
                need a little help.
              </h2>
            </div>
            <div className="space-y-7">
              {[
                {
                  icon: CheckCheck,
                  title: "See how the call went",
                  text: "View confirmations, call history, and available recordings from your family dashboard.",
                },
                {
                  icon: Clock3,
                  title: "Give them another moment",
                  text: "Set the number and timing of follow-up attempts for unanswered calls or requests to call later.",
                },
                {
                  icon: ShieldCheck,
                  title: "Keep care in your hands",
                  text: "Get dashboard alerts when a reminder needs attention. You decide how to follow up with your family.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4">
                  <Icon
                    size={21}
                    className="mt-1 shrink-0 text-sage-700"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="text-[15px] font-semibold text-sage-900">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-sage-600">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="questions"
          className="border-t border-[#e5e7dc] bg-white/50"
        >
          <div className="section-wrap grid gap-8 py-16 md:grid-cols-[.75fr_1.25fr] md:gap-16 sm:py-20">
            <div>
              <p className="eyebrow">A few things to know</p>
              <h2 className="mt-4 font-display text-4xl tracking-[-.025em] text-sage-900">
                Care starts
                <br />
                with clarity.
              </h2>
            </div>
            <div className="divide-y divide-sage-200">
              {faqs.map((faq) => (
                <details key={faq.question} className="landing-faq group py-5">
                  <summary className="focus-ring flex cursor-pointer items-start justify-between gap-5 rounded text-sm font-semibold leading-6 text-sage-900">
                    {faq.question}
                    <Plus
                      size={17}
                      aria-hidden="true"
                      className="faq-plus mt-1 shrink-0 text-sage-600 transition-transform"
                    />
                  </summary>
                  <p className="mt-4 pr-5 text-sm leading-7 text-sage-600">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-sage-800">
          <div className="section-wrap flex flex-col items-start justify-between gap-8 py-14 sm:py-16 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-medium text-[#c8d5c2]">
                A little closer, every day.
              </p>
              <h2 className="mt-3 font-display text-4xl leading-tight tracking-[-.025em] text-white sm:text-[44px]">
                Be there, in the little ways.
              </h2>
            </div>
            <LinkButton
              href="/signup"
              size="lg"
              variant="secondary"
              className="shrink-0 !border-[#e6eddf] !bg-[#e6eddf] !text-sage-900 hover:!bg-white"
            >
              Get started with your family{" "}
              <ChevronRight size={17} aria-hidden="true" />
            </LinkButton>
          </div>
        </section>
      </main>
      <footer className="section-wrap pb-7 pt-9">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <Link
            href="/"
            className="focus-ring w-fit rounded-lg"
            aria-label="ParivaarCall home"
          >
            <BrandLogo className="!w-[172px]" />
          </Link>
          <p className="flex items-center gap-2 text-xs text-sage-600">
            <Globe2 size={14} aria-hidden="true" /> For families, wherever they
            are.
          </p>
          <div className="flex gap-5 text-xs font-medium text-sage-700">
            <Link href="/login" className="focus-ring rounded">
              Log in
            </Link>
            <Link href="/signup" className="focus-ring rounded">
              Get started
            </Link>
          </div>
        </div>
        <div className="mt-6 flex flex-col justify-between gap-3 border-t border-sage-200 pt-5 text-[11px] leading-5 text-sage-600">
          <p>
            ParivaarCall provides reminders, not medical advice or emergency
            support. Live calling is currently available for verified numbers
            only.
          </p>
          <p>© {new Date().getFullYear()} ParivaarCall. Made with care.</p>
        </div>
      </footer>
    </div>
  );
}
