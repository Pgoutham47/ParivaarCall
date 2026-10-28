"use client";

import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setError(null);
    try {
      const { error: signOutError } = await createClient().auth.signOut();
      if (signOutError) throw signOutError;
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Couldn’t sign out. Please try again.");
      setIsSigningOut(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isSigningOut}
        aria-label={isSigningOut ? "Signing out" : "Sign out"}
        className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-xs font-medium text-sage-600 transition hover:bg-sage-50 hover:text-sage-900 disabled:cursor-wait disabled:opacity-60"
      >
        {isSigningOut ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <LogOut className="h-4 w-4" aria-hidden="true" />
        )}
        <span className="inline">
          {isSigningOut ? "Signing out…" : "Sign out"}
        </span>
      </button>
      {error ? (
        <p
          role="alert"
          className="absolute right-0 top-full z-40 mt-2 w-56 rounded-lg border border-rose-200 bg-white p-3 text-xs leading-5 text-rose-700 shadow-sm"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
