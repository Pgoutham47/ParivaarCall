import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  icon?: ReactNode;
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-sage-700 text-white shadow-card hover:bg-sage-800",
  secondary: "border border-sage-200 bg-white text-sage-800 hover:bg-sage-50",
  ghost: "text-sage-800 hover:bg-sage-100"
};

export function Button({
  className,
  variant = "primary",
  icon,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition",
        variants[variant],
        className
      )}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

type LinkButtonProps = {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  icon?: ReactNode;
};

export function LinkButton({ href, children, className, variant = "primary", icon }: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition",
        variants[variant],
        className
      )}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
