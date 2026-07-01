import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BaseFieldProps = {
  label: string;
  children: ReactNode;
};

export function Field({ label, children }: BaseFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-sage-900">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const controlClass =
  "focus-ring block min-h-11 w-full rounded-lg border-sage-200 bg-white px-3 py-2 text-sm text-care-ink shadow-sm placeholder:text-sage-400";

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function SelectInput({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClass, className)} {...props}>
      {children}
    </select>
  );
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClass, "min-h-24", className)} {...props} />;
}
