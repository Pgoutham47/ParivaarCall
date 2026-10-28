"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function RefreshPageButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
      icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
    >
      {pending ? "Refreshing…" : "Try again"}
    </Button>
  );
}
