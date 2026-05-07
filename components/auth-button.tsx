import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export async function AuthButton() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (user) {
    const display =
      (user.user_metadata as { username?: string; full_name?: string } | undefined)?.username ??
      (user.user_metadata as { full_name?: string } | undefined)?.full_name ??
      user.email ??
      "you";
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="hidden sm:inline">Hey, {display}</span>
        <LogoutButton />
      </div>
    );
  }

  return (
    <Button asChild size="sm">
      <Link href="/auth/login">Sign in</Link>
    </Button>
  );
}
