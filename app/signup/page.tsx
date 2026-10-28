import type { Metadata } from "next";
import { AuthForm } from "@/components/forms/AuthForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Create an account · ParivaarCall" };

export default async function SignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <AuthForm mode="signup" />;
}
