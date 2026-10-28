"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  ChartNoAxesCombined,
  ChevronRight,
  Ellipsis,
  Heart,
  House,
  Phone,
  Pill,
  Settings2,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Dialog } from "@/components/ui/Dialog";
import { LogoutButton } from "@/components/auth/LogoutButton";

const primary = [
  { href: "/dashboard", label: "Overview", short: "Home", icon: House },
  {
    href: "/dashboard/parents",
    label: "Your family",
    short: "Family",
    icon: UsersRound,
  },
  {
    href: "/dashboard/medicines",
    label: "Medicine reminders",
    short: "Reminders",
    icon: Pill,
  },
  {
    href: "/dashboard/calls",
    label: "Call history",
    short: "Calls",
    icon: Phone,
  },
];
const secondary = [
  { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
  {
    href: "/dashboard/analytics",
    label: "Care insights",
    icon: ChartNoAxesCombined,
  },
  { href: "/dashboard/settings", label: "Preferences", icon: Settings2 },
];
export function SidebarNav({
  name = "Your account",
  email = "",
}: {
  name?: string;
  email?: string;
}) {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-sage-200 bg-white px-4 lg:flex">
      <Link
        href="/"
        className="focus-ring mx-2 flex h-[88px] shrink-0 items-center rounded-lg"
        aria-label="ParivaarCall home"
      >
        <BrandLogo className="!w-[190px]" priority />
      </Link>
      <div className="flex-1 overflow-y-auto pb-6 pt-7">
        <p className="eyebrow px-3">Your care space</p>
        <nav aria-label="Dashboard navigation" className="mt-4 space-y-1">
          {primary.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={pathname === item.href}
            />
          ))}
        </nav>
        <nav
          aria-label="Insights and preferences"
          className="mt-6 space-y-1 border-t border-sage-100 pt-6"
        >
          {secondary.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={pathname === item.href}
            />
          ))}
        </nav>
        <div className="mx-2 mt-10 rounded-xl bg-[#f3f5ee] p-4">
          <Heart
            size={18}
            strokeWidth={1.5}
            className="text-sage-700"
            aria-hidden="true"
          />
          <p className="mt-3 font-display text-lg text-sage-800">
            A little closer,
            <br />
            every day.
          </p>
          <p className="mt-2 text-xs leading-5 text-sage-600">
            Thoughtful reminders.
            <br />
            More moments of reassurance.
          </p>
        </div>
      </div>
      <div className="border-t border-sage-100 py-4">
        <div className="flex items-center gap-3 px-2">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-full bg-sage-100 text-sm font-semibold text-sage-800"
            aria-hidden="true"
          >
            {name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-care-ink">
              {name}
            </p>
            <p className="mt-1 truncate text-[11px] text-sage-600">{email}</p>
          </div>
        </div>
        <div className="mt-2">
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: (typeof secondary)[number] & { active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring flex min-h-11 items-center gap-3 rounded-xl px-3 text-[13px] transition-colors",
        active
          ? "bg-sage-50 font-semibold text-sage-800"
          : "font-medium text-sage-600 hover:bg-[#f7f8f5] hover:text-sage-800",
      )}
    >
      <Icon size={18} strokeWidth={active ? 1.9 : 1.65} aria-hidden="true" />
      {label}
      {active ? (
        <span
          aria-hidden="true"
          className="ml-auto size-1.5 rounded-full bg-sage-700"
        />
      ) : null}
    </Link>
  );
}
export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = secondary.some((item) => item.href === pathname);
  return (
    <>
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-sage-200 bg-white/95 px-2 pt-1.5 backdrop-blur lg:hidden"
        style={{ paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
          {primary.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={cn(
                "focus-ring flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium",
                pathname === item.href
                  ? "bg-sage-50 text-sage-800"
                  : "text-sage-600",
              )}
            >
              <item.icon size={19} strokeWidth={1.7} aria-hidden="true" />
              <span>{item.short}</span>
            </Link>
          ))}
          <button
            type="button"
            aria-label="More navigation"
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen(true)}
            className={cn(
              "focus-ring flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium",
              moreActive ? "bg-sage-50 text-sage-800" : "text-sage-600",
            )}
          >
            <Ellipsis size={20} aria-hidden="true" />
            <span>More</span>
          </button>
        </div>
      </nav>
      <Dialog
        closeOnBackdrop
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="Your care space"
        description="Insights, preferences, and your account."
      >
        <nav aria-label="More dashboard navigation" className="space-y-2">
          {secondary.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMoreOpen(false)}
              aria-current={pathname === item.href ? "page" : undefined}
              className={cn(
                "focus-ring flex min-h-14 items-center gap-3 rounded-xl px-4 text-sm font-medium",
                pathname === item.href
                  ? "bg-sage-50 text-sage-800"
                  : "text-sage-700 hover:bg-sage-50",
              )}
            >
              <item.icon size={19} strokeWidth={1.6} aria-hidden="true" />
              {item.label}
              <ChevronRight size={16} className="ml-auto" aria-hidden="true" />
            </Link>
          ))}
        </nav>
        <div className="mt-5 border-t border-sage-100 pt-3">
          <LogoutButton />
        </div>
      </Dialog>
    </>
  );
}
