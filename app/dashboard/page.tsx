import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Market, Payout, Prediction } from "@/lib/types";

type PredictionWithMarket = Prediction & { market: Pick<Market, "id" | "question" | "status" | "winning_outcome"> | null };
type PayoutWithMarket = Payout & { market: Pick<Market, "id" | "question" | "winning_outcome" | "status"> | null };

export default function DashboardPage() {
  return (
    <SiteShell>
      <div className="flex flex-col gap-6 py-8">
        <Suspense fallback={<DashboardLoading />}>
          <DashboardContent />
        </Suspense>
      </div>
    </SiteShell>
  );
}

function DashboardLoading() {
  return <div className="text-sm text-muted-foreground">Loading dashboard…</div>;
}

async function DashboardContent() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/auth/login");

  const [{ data: profile }, { data: predictions }, { data: payouts }] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, token_balance, role, created_at")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("predictions")
      .select("*, market:markets(id, question, status, winning_outcome)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("payouts")
      .select("*, market:markets(id, question, winning_outcome, status)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const balance = Number(profile?.token_balance ?? 0);
  const preds = (predictions ?? []) as PredictionWithMarket[];
  const pays = (payouts ?? []) as PayoutWithMarket[];

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Hi{profile?.username ? `, ${profile.username}` : ""} &middot; {profile?.role ?? "user"}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gold</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">{balance.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">gold</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your predictions</CardTitle>
        </CardHeader>
        <CardContent>
          {preds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No predictions yet.</p>
          ) : (
            <ul className="flex flex-col">
              {preds.map((p) => {
                const status = p.market?.status;
                const winner = p.market?.winning_outcome;
                const settled = status === "paid" || status === "cancelled";
                const won = settled && winner === p.outcome;
                const lost = settled && winner && winner !== p.outcome;
                const refunded = status === "cancelled";
                return (
                  <li key={p.id} className="flex items-center justify-between border-b last:border-b-0 py-2 text-sm">
                    <div className="flex flex-col">
                      <Link
                        href={p.market ? `/markets/${p.market.id}` : "#"}
                        className="hover:underline"
                      >
                        {p.market?.question ?? "(deleted market)"}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={
                          p.outcome === "yes"
                            ? "text-emerald-600 dark:text-emerald-400 font-medium"
                            : "text-rose-600 dark:text-rose-400 font-medium"
                        }
                      >
                        {p.outcome.toUpperCase()} {Number(p.amount).toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {refunded ? "refunded" : won ? "won" : lost ? "lost" : status ?? "open"}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          {pays.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payouts yet.</p>
          ) : (
            <ul className="flex flex-col">
              {pays.map((p) => (
                <li key={p.id} className="flex items-center justify-between border-b last:border-b-0 py-2 text-sm">
                  <div className="flex flex-col">
                    <Link
                      href={p.market ? `/markets/${p.market.id}` : "#"}
                      className="hover:underline"
                    >
                      {p.market?.question ?? "(deleted market)"}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleString()} &middot;{" "}
                      {p.market?.status === "cancelled" ? "refund" : `winner: ${p.market?.winning_outcome ?? "?"}`}
                    </span>
                  </div>
                  <span className="font-medium">+{Number(p.amount).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
