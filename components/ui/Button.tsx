import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  icon?: ReactNode;
  size?: ButtonSize;
};
const variants: Record<ButtonVariant, string> = {
  primary:
    "border border-sage-800 bg-sage-800 text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)] hover:border-sage-900 hover:bg-sage-900",
  secondary:
    "border border-sage-200 bg-white text-sage-800 hover:border-sage-300 hover:bg-sage-50",
  ghost: "border border-transparent text-sage-700 hover:bg-sage-100",
  danger: "border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100",
};
const sizes = {
  sm: "min-h-10 rounded-lg px-3 py-2 text-xs",
  md: "min-h-11 rounded-xl px-4 py-2.5 text-sm",
  lg: "min-h-12 rounded-xl px-6 py-3 text-sm",
};
const base =
  "focus-ring inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
export function Button({
  className,
  variant = "primary",
  size = "md",
  icon,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(base, sizes[size], variants[variant], className)}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
export function LinkButton({
  href,
  children,
  className,
  variant = "primary",
  icon,
  size = "md",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  icon?: ReactNode;
  size?: ButtonSize;
}) {
  return (
    <Link
      href={href}
      className={cn(base, sizes[size], variants[variant], className)}
    >
      {icon}
      {children}
    </Link>
  );
}
