"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={handleLogout}
      icon={<LogOut className="h-4 w-4" aria-hidden="true" />}
      aria-label="Log out"
      className="h-10 min-h-10 px-3"
    >
      <span className="hidden sm:inline">Logout</span>
    </Button>
  );
}
