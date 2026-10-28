import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "card-padding rounded-2xl border border-sage-200 bg-white shadow-[0_2px_4px_rgba(24,47,35,0.02)]",
        className,
      )}
      {...props}
    />
  );
}
