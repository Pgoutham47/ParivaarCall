import { cn, formatEnum } from "@/lib/utils";

type Tone = "green" | "amber" | "red" | "blue" | "neutral";

const toneClasses: Record<Tone, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-800 ring-amber-100",
  red: "bg-rose-50 text-rose-700 ring-rose-100",
  blue: "bg-sky-50 text-sky-700 ring-sky-100",
  neutral: "bg-sage-50 text-sage-700 ring-sage-100"
};

export function StatusBadge({
  label,
  tone = "neutral",
  className
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        toneClasses[tone],
        className
      )}
    >
      {formatEnum(label)}
    </span>
  );
}
