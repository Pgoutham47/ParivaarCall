"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, TextInput } from "@/components/ui/Field";
import { upsertProfile } from "@/lib/services/auth";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createClient();

      if (isSignup) {
        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });

        if (signupError) {
          throw new Error(signupError.message);
        }

        if (data.user && data.session) {
          await upsertProfile(supabase, { id: data.user.id, fullName });
          router.replace("/dashboard");
          router.refresh();
          return;
        }

        setMessage("Account created. Check your email to confirm your address before logging in.");
        return;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (loginError) {
        throw new Error(loginError.message);
      }

      router.replace(searchParams.get("next") || "/dashboard");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="focus-ring mx-auto flex w-fit items-center gap-3 rounded-lg">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-sage-700 font-bold text-white">PC</span>
          <span className="text-lg font-bold text-care-ink">Parivaar Call</span>
        </Link>

        <Card className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sage-600">
            {isSignup ? "Start caring" : "Welcome back"}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-care-ink">
            {isSignup ? "Create your caregiver account" : "Log in to your dashboard"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-sage-700">
            {isSignup
              ? "Create an account to save parents, medicine schedules, and call preferences."
              : "Sign in to manage your family medicine reminders."}
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {isSignup ? (
              <Field label="Full name">
                <TextInput
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your name"
                  required
                />
              </Field>
            ) : null}
            <Field label="Email">
              <TextInput
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </Field>
            <Field label="Password">
              <TextInput
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                minLength={6}
                required
              />
            </Field>
            {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p> : null}
            {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{message}</p> : null}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Please wait..." : isSignup ? "Create Account" : "Log In"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-sage-700">
            {isSignup ? "Already have an account? " : "New to Parivaar Call? "}
            <Link className="font-semibold text-sage-800 underline-offset-4 hover:underline" href={isSignup ? "/login" : "/signup"}>
              {isSignup ? "Log in" : "Sign up"}
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
