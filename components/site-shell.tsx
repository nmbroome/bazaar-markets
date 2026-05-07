import Link from "next/link";
import { Suspense } from "react";

import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";

async function NavLinks() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;

  let isAdmin = false;
  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    isAdmin = profile?.role === "admin";
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <Link href="/" className="hover:underline">Markets</Link>
      {userId && (
        <>
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <Link href="/profile" className="hover:underline">Profile</Link>
        </>
      )}
      {isAdmin && (
        <Link href="/admin" className="hover:underline">Admin</Link>
      )}
    </div>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-12 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-6 items-center">
              <Link href="/" className="font-semibold">Bazaar Markets</Link>
              <Suspense fallback={null}>
                <NavLinks />
              </Suspense>
            </div>
            <div className="flex items-center gap-3">
              {!hasEnvVars ? (
                <EnvVarWarning />
              ) : (
                <Suspense>
                  <AuthButton />
                </Suspense>
              )}
              <ThemeSwitcher />
            </div>
          </div>
        </nav>
        <div className="flex-1 w-full max-w-5xl px-5 pb-12">{children}</div>
      </div>
    </main>
  );
}
