import { freeTierCalling } from "@/lib/calling-access";
import type { ReactNode } from "react";
import { Bell, UserRound } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { BottomNav, SidebarNav } from "@/components/layout/DashboardNav";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <SidebarNav />
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-sage-100 bg-care-cream/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <Link href="/" className="focus-ring mb-2 block w-fit rounded-lg lg:hidden">
            <BrandLogo />
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage-600">Caregiver dashboard</p>
              <p className="max-w-[45vw] truncate text-xs text-sage-700 sm:text-sm">Signed in as {user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/alerts" className="focus-ring flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sage-700 shadow-sm" aria-label="Alerts">
                <Bell className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link href="/dashboard/settings" className="focus-ring flex h-10 w-10 items-center justify-center rounded-lg bg-sage-700 text-white shadow-sm" aria-label="Account settings">
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </Link>
              <LogoutButton />
            </div>
          </div>
        </header>
        <main className="px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:pb-10">
          {freeTierCalling() ? <aside className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"><strong>Free-tier calling: verified numbers only.</strong> We currently use free-tier services. Only numbers verified for this account can receive calls. Adding a parent does not verify their number; ask your account administrator to arrange verification.</aside> : null}
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
