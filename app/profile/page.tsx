import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ProfileForm } from "@/components/profile-form";
import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default function ProfilePage() {
  return (
    <SiteShell>
      <div className="flex flex-col gap-6 py-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Profile</h1>
          <p className="text-sm text-muted-foreground">Account info and username.</p>
        </header>
        <Suspense fallback={<ProfileLoading />}>
          <ProfileContent />
        </Suspense>
      </div>
    </SiteShell>
  );
}

function ProfileLoading() {
  return <div className="text-sm text-muted-foreground">Loading profile…</div>;
}

async function ProfileContent() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, token_balance, role, created_at")
    .eq("id", userId)
    .maybeSingle();

  const meta = (claims?.claims?.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
    global_name?: string;
    avatar_url?: string;
  };
  const discordDisplay = meta.global_name ?? meta.full_name ?? meta.name ?? null;
  const email = (claims?.claims?.email as string | undefined) ?? null;
  const balance = Number(profile?.token_balance ?? 0);
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString()
    : "—";

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Field label="Gold" value={balance.toLocaleString()} />
          <Field label="Role" value={profile?.role ?? "user"} capitalize />
          <Field label="Email" value={email ?? "—"} />
          <Field label="Discord display name" value={discordDisplay ?? "—"} />
          <Field label="Member since" value={memberSince} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Username</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm currentUsername={profile?.username ?? ""} />
        </CardContent>
      </Card>
    </>
  );
}

function Field({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={capitalize ? "capitalize" : undefined}>{value}</span>
    </div>
  );
}
