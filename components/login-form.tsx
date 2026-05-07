"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDiscordLogin = async () => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
    // On success, the browser is redirected to Discord; nothing else to do.
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            Use your Discord account to play in Bazaar Markets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button
              type="button"
              onClick={handleDiscordLogin}
              disabled={isLoading}
              className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white"
            >
              <DiscordIcon />
              {isLoading ? "Redirecting…" : "Continue with Discord"}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground text-center">
              New here? Signing in with Discord creates your account and credits
              1,000 starter gold.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DiscordIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3.2a.075.075 0 0 0-.079.038c-.211.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.487 0 12.46 12.46 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 5.93 4.369a.07.07 0 0 0-.032.027C2.533 9.046 1.602 13.58 2.06 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.992 3.03.078.078 0 0 0 .084-.027 14.09 14.09 0 0 0 1.226-1.994.075.075 0 0 0-.041-.105 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.371-.291a.075.075 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.062 0a.075.075 0 0 1 .078.009c.12.099.245.198.372.292a.077.077 0 0 1-.006.128 12.299 12.299 0 0 1-1.873.891.076.076 0 0 0-.04.106c.36.698.772 1.362 1.225 1.993a.077.077 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.056c.5-5.177-.838-9.674-3.548-13.66a.061.061 0 0 0-.031-.029ZM8.02 15.331c-1.182 0-2.156-1.085-2.156-2.418 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.332-.956 2.417-2.157 2.417Zm7.974 0c-1.183 0-2.157-1.085-2.157-2.418 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.156 2.42 0 1.332-.945 2.417-2.156 2.417Z" />
    </svg>
  );
}
