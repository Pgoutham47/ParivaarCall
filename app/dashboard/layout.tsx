import type { ReactNode } from "react";
import { ChevronDown, Info } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { freeTierCalling } from "@/lib/calling-access";
import { isPresentationDemo } from "@/lib/demo-account";
import { BottomNav, SidebarNav } from "@/components/layout/DashboardNav";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const name =
    typeof user.user_metadata?.full_name === "string" &&
    user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : "Your account";
  const { count } = await supabase
    .from("alerts")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);
  return (
    <div className="min-h-screen bg-[#f7f8f5]">
      <a
        href="#dashboard-content"
        className="skip-link focus-ring rounded-xl bg-white px-4 py-3 text-sm font-semibold shadow-card"
      >
        Skip to content
      </a>
      <SidebarNav name={name} email={user.email ?? ""} />
      <div className="lg:pl-[248px]">
        <DashboardHeader name={name} unread={count ?? 0} />
        <main
          id="dashboard-content"
          className="mx-auto max-w-[1440px] px-5 py-7 pb-28 sm:px-8 sm:py-8 lg:px-10 lg:pb-12"
        >
          {isPresentationDemo(user.id) ? (
            <aside
              className="mb-7 rounded-xl border border-sage-200 bg-sage-50 px-4 py-3 text-sm leading-6 text-sage-800"
              aria-label="Demo workspace"
            >
              <p className="font-semibold">
                Presentation demo · Fictional sample activity
              </p>
              <p className="mt-1 text-xs leading-5 text-sage-700">
                Explore family profiles, medicine routines, example
                conversations, and alerts. Calls and notifications are disabled
                for this account. Changes are shared with everyone using this
                demo login.
              </p>
            </aside>
          ) : freeTierCalling() ? (
            <details className="group mb-7 rounded-xl border border-[#e5dfc7] bg-[#faf7ec] px-4 py-3 text-xs text-[#756344]">
              <summary className="focus-ring flex cursor-pointer items-center gap-2.5 rounded leading-5">
                <Info size={15} className="shrink-0" aria-hidden="true" />
                <span>
                  <span className="font-semibold">Verified numbers only.</span>{" "}
                  <span className="hidden sm:inline">
                    Your account uses free-tier calling.
                  </span>
                </span>
                <span className="ml-auto flex shrink-0 items-center gap-1.5 text-[11px]">
                  Details
                  <ChevronDown
                    size={13}
                    className="transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </span>
              </summary>
              <p className="mt-3 max-w-3xl border-t border-[#e5dfc7] pt-3 leading-6">
                Live calls can only reach numbers verified for your account.
                Adding a parent does not verify their number. Your account
                administrator can arrange verification.{" "}
                <Link
                  href="/dashboard/parents"
                  className="focus-ring rounded font-semibold underline underline-offset-4"
                >
                  Review your family’s calling access
                </Link>
                .
              </p>
            </details>
          ) : null}
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
