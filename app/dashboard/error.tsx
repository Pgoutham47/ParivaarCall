"use client";
import { Button } from "@/components/ui/Button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <div role="alert" className="rounded-xl bg-white p-6"><h1 className="text-xl font-bold">We couldn’t load this page</h1><p className="my-4 text-sage-700">Please check your connection and try again. Your saved information is unchanged.</p><Button onClick={reset}>Try again</Button></div>;
}
