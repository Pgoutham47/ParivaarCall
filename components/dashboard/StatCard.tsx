import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const accents = {
  mint: "bg-care-mint text-sage-700",
  blue: "bg-care-blue text-sky-800",
  peach: "bg-care-blush text-rose-700",
  sage: "bg-sage-100 text-sage-800"
};

export function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  accent = "sage"
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
  accent?: keyof typeof accents;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-sage-700">{label}</p>
          <p className="mt-2 text-3xl font-bold text-care-ink">{value}</p>
        </div>
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-lg", accents[accent])}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-sm text-sage-600">{helper}</p>
    </Card>
  );
}
