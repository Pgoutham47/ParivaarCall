"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarClock,
  ChartColumn,
  Home,
  Pill,
  Settings,
  UsersRound
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/parents", label: "Parents", icon: UsersRound },
  { href: "/dashboard/medicines", label: "Medicines", icon: Pill },
  { href: "/dashboard/calls", label: "Calls", icon: CalendarClock },
  { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
  { href: "/dashboard/analytics", label: "Analytics", icon: ChartColumn },
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-sage-100 bg-white/85 px-5 py-6 backdrop-blur lg:block">
      <Link href="/" className="focus-ring flex items-center gap-3 rounded-lg">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sage-700 text-lg font-bold text-white">
          PC
        </div>
        <div>
          <p className="text-base font-bold text-care-ink">Parivaar Call</p>
          <p className="text-xs text-sage-600">Family medicine care</p>
        </div>
      </Link>

      <nav className="mt-8 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "focus-ring flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition",
                active ? "bg-sage-700 text-white shadow-card" : "text-sage-700 hover:bg-sage-50"
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 rounded-lg bg-care-mint p-4">
        <p className="text-sm font-semibold text-care-ink">No app for parents</p>
        <p className="mt-1 text-sm leading-6 text-sage-700">
          They simply receive familiar phone calls in their preferred language.
        </p>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-sage-100 bg-white/95 px-2 py-2 shadow-[0_-10px_30px_rgba(36,50,43,0.08)] backdrop-blur lg:hidden">
      <div className="grid grid-cols-7 gap-1">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "focus-ring flex min-h-14 flex-col items-center justify-center rounded-lg px-1 text-[11px] font-semibold transition",
                active ? "bg-sage-700 text-white" : "text-sage-700"
              )}
              aria-label={item.label}
            >
              <Icon className="mb-1 h-5 w-5" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
