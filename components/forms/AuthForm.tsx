"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Languages,
  Loader2,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Field, TextInput } from "@/components/ui/Field";
import { upsertProfile } from "@/lib/services/auth";
import { createClient } from "@/lib/supabase/client";

function destinationAfterLogin(value: string | null) {
  // Only authenticated app routes may be used as a return destination.
  return value &&
    /^\/dashboard(?:\/|[?#]|$)/.test(value) &&
    !/[\\\u0000-\u001f]/.test(value)
    ? value
    : "/dashboard";
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    if (isSignup && !fullName.trim()) {
      setError("Enter your name to create your account.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createClient();

      if (isSignup) {
        const { data, error: signupError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (signupError) throw new Error(signupError.message);

        if (data.user && data.session) {
          await upsertProfile(supabase, {
            id: data.user.id,
            fullName: fullName.trim(),
          });
          router.replace("/dashboard");
          router.refresh();
          return;
        }
        setMessage(
          "Check your inbox to confirm your email address. Once confirmed, you can sign in and set up your family.",
        );
        return;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (loginError) throw new Error(loginError.message);
      router.replace(destinationAfterLogin(searchParams.get("next")));
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "We couldn’t sign you in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden min-h-screen flex-col overflow-hidden bg-[#EDF1E9] px-10 py-9 lg:flex xl:px-16">
        <Link
          href="/"
          className="focus-ring relative z-10 w-fit rounded-md"
          aria-label="ParivaarCall home"
        >
          <BrandLogo className="!w-48" priority />
        </Link>
        <div className="relative z-10 my-auto max-w-lg py-16">
          <p className="eyebrow text-sage-700">A little closer, every day</p>
          <h2 className="font-display mt-6 text-5xl leading-[1.12] tracking-[-0.035em] text-sage-900 xl:text-6xl">
            Care carries.
            <br />
            Even from afar.
          </h2>
          <p className="mt-6 max-w-sm text-base leading-7 text-sage-700">
            Keep your family’s medicine routine close, wherever life takes you.
          </p>
          <div className="mt-12 rounded-2xl bg-sage-800 p-7 text-white">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10">
                <Phone
                  className="h-5 w-5"
                  strokeWidth={1.7}
                  aria-hidden="true"
                />
              </div>
              <p className="font-display text-2xl leading-snug">
                No new app for them.
                <br />
                Just a familiar phone call.
              </p>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/15 pt-5 text-xs leading-5 text-white/80">
              <span className="inline-flex items-center gap-2">
                <Languages className="h-4 w-4" aria-hidden="true" /> Five call
                languages
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4" aria-hidden="true" /> Updates for
                your family
              </span>
            </div>
          </div>
        </div>
        <p className="relative z-10 text-xs text-sage-600">
          Thoughtfully made for families living apart.
        </p>
        <div
          className="pointer-events-none absolute -bottom-64 -right-60 h-[600px] w-[600px] rounded-full border border-sage-200/70"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-44 -right-40 h-[440px] w-[440px] rounded-full border border-sage-200/70"
          aria-hidden="true"
        />
      </aside>

      <div className="flex min-h-screen flex-col px-6 py-7 sm:px-12 lg:px-10">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="focus-ring rounded-md lg:hidden"
            aria-label="ParivaarCall home"
          >
            <BrandLogo className="!w-40" priority />
          </Link>
          <Link
            href="/"
            className="focus-ring ml-auto inline-flex min-h-11 items-center gap-2 rounded-md text-xs font-medium text-sage-600 transition hover:text-sage-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to
            home
          </Link>
        </div>

        <div className="mx-auto my-auto w-full max-w-[400px] py-12 sm:py-16">
          <p className="eyebrow">
            {isSignup ? "Your family, connected" : "Good to see you again"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-care-ink sm:text-4xl">
            {isSignup ? "A little more peace of mind." : "Welcome back."}
          </h1>
          <p className="mt-4 text-sm leading-6 text-sage-600">
            {isSignup
              ? "Create your account to start a simpler medicine routine for your family."
              : "Sign in to see how your family’s day is going."}
          </p>

          <form
            className="mt-8 space-y-5"
            onSubmit={handleSubmit}
            aria-busy={isSubmitting}
          >
            <fieldset
              disabled={isSubmitting || Boolean(message)}
              className="space-y-5"
            >
              <legend className="sr-only">
                {isSignup ? "Create an account" : "Account sign in"}
              </legend>
              {isSignup ? (
                <Field label="Your full name">
                  <TextInput
                    name="name"
                    autoComplete="name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="e.g. Ananya Rao"
                    maxLength={100}
                    required
                  />
                </Field>
              ) : null}
              <Field label="Email address">
                <TextInput
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </Field>
              <div>
                <label
                  htmlFor="auth-password"
                  className="text-sm font-medium text-sage-900"
                >
                  Password
                </label>
                <div className="relative mt-1.5">
                  <TextInput
                    id="auth-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      isSignup ? "new-password" : "current-password"
                    }
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={
                      isSignup ? "Create a password" : "Enter your password"
                    }
                    minLength={isSignup ? 6 : undefined}
                    className="pr-12"
                    aria-describedby={isSignup ? "password-hint" : undefined}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    className="focus-ring absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-sage-500 hover:text-sage-800"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {isSignup ? (
                  <p id="password-hint" className="mt-2 text-xs text-sage-600">
                    Use at least 6 characters.
                  </p>
                ) : null}
              </div>
            </fieldset>
            {error ? (
              <p role="alert" className="notice-error">
                {error}
              </p>
            ) : null}
            {message ? (
              <p role="status" className="notice-success">
                {message}
              </p>
            ) : null}
            <Button
              type="submit"
              className="w-full !min-h-12"
              disabled={isSubmitting || Boolean(message)}
              icon={
                isSubmitting ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : message ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                )
              }
            >
              {isSubmitting
                ? isSignup
                  ? "Creating your account…"
                  : "Signing in…"
                : message
                  ? "Check your email"
                  : isSignup
                    ? "Create your account"
                    : "Sign in"}
            </Button>
          </form>
          <p className="mt-7 text-center text-sm leading-6 text-sage-600">
            {isSignup
              ? "Already part of the family? "
              : "New to ParivaarCall? "}
            <Link
              className="focus-ring rounded-sm font-semibold text-sage-800 underline decoration-sage-200 underline-offset-4 hover:decoration-sage-700"
              href={isSignup ? "/login" : "/signup"}
            >
              {isSignup ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>

        <p className="mx-auto flex max-w-sm items-start justify-center gap-2 text-center text-xs leading-5 text-sage-600">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Your family’s information stays in your account.</span>
        </p>
      </div>
    </main>
  );
}
