import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  HeartHandshake,
  Languages,
  PhoneCall,
  ShieldCheck
} from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const promises = [
  {
    icon: HeartHandshake,
    title: "For children living away from parents",
    text: "Keep daily medicine routines visible without asking your parent to learn a new app."
  },
  {
    icon: PhoneCall,
    title: "Parents receive normal phone calls, no app needed",
    text: "Parents receive a familiar call, hear the medicine reminder, and confirm in their language."
  },
  {
    icon: ShieldCheck,
    title: "Built for gentle follow-up",
    text: "Missed responses, retry attempts, and alerts are planned into the care workflow from day one."
  }
];

export default function LandingPage() {
  return (
    <main>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="focus-ring flex items-center gap-3 rounded-lg">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-sage-700 font-bold text-white">PC</span>
          <span className="text-lg font-bold text-care-ink">Parivaar Call</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login" className="focus-ring rounded-lg px-3 py-2 text-sm font-semibold text-sage-800 hover:bg-sage-50">
            Log in
          </Link>
          <LinkButton href="/signup" className="hidden sm:inline-flex">
            Get Started
          </LinkButton>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-14 pt-6 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-20 lg:pt-14">
        <div>
          <p className="inline-flex rounded-full bg-care-mint px-3 py-1 text-sm font-semibold text-sage-800">
            Medicine care for families across distance
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight text-care-ink sm:text-5xl lg:text-6xl">
            A gentle call home, so medicines are not missed.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-sage-700 sm:text-lg">
            Parivaar Call helps children and caregivers create medicine schedules for elderly parents.
            Later, the system will call the parent in their native language, confirm the dose, retry missed
            calls, and alert the family when help is needed.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/signup" icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}>
              Get Started
            </LinkButton>
            <LinkButton href="/dashboard" variant="secondary">
              View MVP Dashboard
            </LinkButton>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[2rem] bg-white p-3 shadow-soft">
            <div className="rounded-[1.5rem] border border-sage-100 bg-care-cream p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-sage-700">Today for Amma</p>
                  <p className="text-2xl font-bold text-care-ink">8:00 AM call confirmed</p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-sage-700 text-white">
                  <PhoneCall className="h-6 w-6" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-6 space-y-3">
                {["Metformin after breakfast", "Blood pressure tablet before lunch", "Vitamin D in the evening"].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-card">
                    <CheckCircle2 className={index === 1 ? "h-5 w-5 text-amber-600" : "h-5 w-5 text-emerald-600"} aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-care-ink">{item}</p>
                      <p className="text-xs text-sage-600">{index === 1 ? "Scheduled at 1:00 PM" : "Family dashboard updated"}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-lg bg-care-blue p-4">
                <div className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-sky-800" aria-hidden="true" />
                  <p className="font-semibold text-care-ink">Telugu voice reminder</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-sage-700">
                  Parents hear a respectful, familiar prompt. No smartphone, login, or new habit required.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-sage-100 bg-white/75">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:px-6 md:grid-cols-3">
          {promises.map((promise) => {
            const Icon = promise.icon;
            return (
              <Card key={promise.title} className="h-full">
                <Icon className="h-7 w-7 text-sage-700" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-bold text-care-ink">{promise.title}</h2>
                <p className="mt-2 text-sm leading-6 text-sage-700">{promise.text}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sage-600">How the MVP starts</p>
          <h2 className="mt-3 text-3xl font-bold text-care-ink">Set up family care today. Add calling later.</h2>
          <p className="mt-4 text-base leading-8 text-sage-700">
            This foundation focuses on the caregiver web app: accounts, parents, medicines, call logs, alerts,
            and voice preferences. Real telephony, payment, and voice services are intentionally left for the
            next development phase.
          </p>
        </div>
      </section>
    </main>
  );
}
