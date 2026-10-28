"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <Card role="alert" className="mx-auto max-w-xl px-6 py-12 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage-50 text-sage-600">
        <WifiOff className="h-6 w-6" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-care-ink">
        Let’s try that again
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-sage-600">
        We couldn’t load this page. Check your connection and try again. Your
        saved information is unchanged.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button
          onClick={reset}
          icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
        >
          Try again
        </Button>
        <LinkButton href="/dashboard" variant="secondary">
          Back to overview
        </LinkButton>
      </div>
    </Card>
  );
}
