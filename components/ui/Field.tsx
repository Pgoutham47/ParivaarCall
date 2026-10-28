import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-care-ink">{label}</span>
      <div className="mt-2">{children}</div>
      {hint ? (
        <span className="mt-1.5 block text-xs leading-5 text-sage-600">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
const controlClass =
  "block min-h-12 w-full rounded-xl border-sage-200 bg-white px-3.5 py-2.5 text-base text-care-ink placeholder:text-sage-500 focus:border-sage-600 focus:ring-2 focus:ring-sage-100 disabled:cursor-not-allowed disabled:bg-sage-50 disabled:text-sage-500 sm:text-sm";
export function TextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />;
}
export function SelectInput({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClass, "pr-10", className)} {...props}>
      {children}
    </select>
  );
}
export function TextArea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(controlClass, "min-h-24", className)} {...props} />
  );
}
