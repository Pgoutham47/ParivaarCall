import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-sage-100 bg-white/90 p-5 shadow-card backdrop-blur",
        className
      )}
      {...props}
    />
  );
}
