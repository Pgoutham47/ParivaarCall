import type { ReactNode } from "react";

export function PageHeader({
  title,
  eyebrow,
  description,
  action
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sage-600">{eyebrow}</p> : null}
        <h1 className="mt-2 text-2xl font-bold text-care-ink sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-sage-700">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
