"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Call outcomes land asynchronously: the Bolna webhook or the scheduler writes
// them minutes after the page was rendered. Without this the caregiver sees a
// stale list until they reload by hand.
export function AutoRefresh({ intervalSeconds = 20 }: { intervalSeconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    // Refreshing a hidden tab wastes requests and the user sees nothing.
    function refreshIfVisible() {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }

    const timer = setInterval(refreshIfVisible, intervalSeconds * 1000);
    // Catch up immediately when the tab is brought back to the foreground.
    document.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [router, intervalSeconds]);

  return null;
}
