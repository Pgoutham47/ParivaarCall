import { cn, formatEnum } from "@/lib/utils";
type Tone = "green" | "amber" | "red" | "blue" | "neutral";
const toneClasses: Record<Tone, string> = {
  green: "bg-sage-50 text-sage-800",
  amber: "bg-amber-50 text-amber-800",
  red: "bg-rose-50 text-rose-800",
  blue: "bg-sky-50 text-sky-800",
  neutral: "bg-[#f0f2ee] text-sage-700",
};
export function StatusBadge({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium leading-4",
        toneClasses[tone],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-full bg-current opacity-70"
      />
      {formatEnum(label)}
    </span>
  );
}
