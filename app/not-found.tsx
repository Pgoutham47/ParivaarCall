import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LinkButton } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col bg-care-cream px-6 py-8">
      <Link
        href="/"
        aria-label="ParivaarCall home"
        className="focus-ring mx-auto w-fit rounded-lg"
      >
        <BrandLogo priority />
      </Link>
      <div className="mx-auto my-auto max-w-xl py-20 text-center">
        <p className="eyebrow">Page not found · 404</p>
        <h1 className="mt-6 font-display text-4xl leading-tight tracking-tight text-sage-900 sm:text-5xl">
          Let’s find your way back.
        </h1>
        <p className="mx-auto mt-5 max-w-sm text-sm leading-7 text-sage-600">
          This page may have moved, or the link may be incomplete. Your family’s
          care space is a good place to start.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
          <LinkButton href="/dashboard">
            Open your dashboard <ArrowRight size={16} aria-hidden="true" />
          </LinkButton>
          <LinkButton href="/" variant="secondary">
            <ArrowLeft size={16} aria-hidden="true" /> Back to home
          </LinkButton>
        </div>
      </div>
    </main>
  );
}
