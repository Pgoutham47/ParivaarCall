"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
const titles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/parents": "Your family",
  "/dashboard/medicines": "Medicine reminders",
  "/dashboard/calls": "Call history",
  "/dashboard/alerts": "Alerts",
  "/dashboard/analytics": "Care insights",
  "/dashboard/settings": "Preferences",
};
export function DashboardHeader({
  name,
  unread,
}: {
  name: string;
  unread: number;
}) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between gap-4 border-b border-sage-200 bg-[#f7f8f5]/95 px-5 backdrop-blur sm:px-8 lg:h-[80px] lg:px-10">
      <Link
        href="/dashboard"
        className="focus-ring rounded-lg lg:hidden"
        aria-label="ParivaarCall dashboard"
      >
        <BrandLogo className="!w-[162px]" />
      </Link>
      <div className="hidden items-center gap-3 text-xs lg:flex">
        <span className="text-sage-500">Family workspace</span>
        <ChevronRight size={13} className="text-sage-400" aria-hidden="true" />
        <span className="font-medium text-sage-800">
          {titles[pathname] ?? "Dashboard"}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <Link
          href="/dashboard/alerts"
          className="focus-ring relative grid size-10 place-items-center rounded-full text-sage-600 hover:bg-sage-100"
          aria-label={unread ? `Alerts, ${unread} unread` : "Alerts"}
        >
          <Bell size={19} strokeWidth={1.6} aria-hidden="true" />
          {unread > 0 ? (
            <span
              className="absolute right-2 top-2 size-1.5 rounded-full bg-[#b87250] ring-2 ring-[#f7f8f5]"
              aria-hidden="true"
            />
          ) : null}
        </Link>
        <div className="mx-1 hidden h-5 w-px bg-sage-200 sm:block" />
        <Link
          href="/dashboard/settings"
          aria-label={`Account preferences for ${name}`}
          className="focus-ring flex items-center gap-2.5 rounded-full p-1"
        >
          <span
            className="grid size-8 shrink-0 place-items-center rounded-full border border-[#e8d7c5] bg-[#f0e5d7] text-xs font-semibold text-[#806047]"
            aria-hidden="true"
          >
            {name.charAt(0).toUpperCase()}
          </span>
          <span className="hidden max-w-32 truncate pr-2 text-xs font-medium text-sage-700 sm:block">
            {name.split(" ")[0]}
          </span>
        </Link>
      </div>
    </header>
  );
}
