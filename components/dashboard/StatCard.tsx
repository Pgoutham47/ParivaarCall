import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
const accents = {
  mint: "text-sage-600",
  blue: "text-sky-700",
  peach: "text-[#ad654f]",
  sage: "text-sage-700",
};
export function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  accent = "sage",
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
  accent?: keyof typeof accents;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-sage-600 sm:text-sm">{label}</p>
        <Icon
          className={cn("size-[18px] shrink-0", accents[accent])}
          strokeWidth={1.6}
          aria-hidden="true"
        />
      </div>
      <p className="mt-4 text-[32px] font-semibold leading-none tracking-[-0.04em] text-care-ink tabular-nums">
        {value}
      </p>
      <p className="mt-3 text-xs leading-5 text-sage-600">{helper}</p>
    </Card>
  );
}
