import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { OddsBar } from "@/components/odds-bar";
import { PredictionForm } from "@/components/prediction-form";
import { SiteShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  displayProbabilities,
  estimatedMultipliers,
  isMarketPredictable,
  totalRealPool,
} from "@/lib/markets";
import { createClient } from "@/lib/supabase/server";
import type { Market, MarketPool, Prediction } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MarketDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <SiteShell>
      <div className="flex flex-col gap-6 py-8">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          &larr; All markets
        </Link>
        <Suspense fallback={<DetailLoading />}>
          <MarketDetail id={id} />
        </Suspense>
      </div>
    </SiteShell>
  );
}

function DetailLoading() {
  return <div className="text-sm text-muted-foreground">Loading market…</div>;
}

async function MarketDetail({ id }: { id: string }) {
  const supabase = await createClient();

  const { data: market } = await supabase
    .from("markets")
    .select("*")
    .eq("id", id)
    .maybeSingle<Market>();

  if (!market) notFound();

  const { data: pool } = await supabase
    .from("market_pools")
    .select("*")
    .eq("market_id", id)
    .maybeSingle<MarketPool>();

  const safePool: MarketPool = pool ?? {
    market_id: id,
    yes_pool: 0,
    no_pool: 0,
    yes_prediction_count: 0,
    no_prediction_count: 0,
    updated_at: market.created_at,
  };

  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;

  let userBalance = 0;
  let userPredictions: Prediction[] = [];
  let userTotalOnMarket = 0;
  if (userId) {
    const [{ data: profile }, { data: preds }] = await Promise.all([
      supabase.from("profiles").select("token_balance").eq("id", userId).maybeSingle(),
      supabase
        .from("predictions")
        .select("*")
        .eq("user_id", userId)
        .eq("market_id", id)
        .order("created_at", { ascending: false }),
    ]);
    userBalance = Number(profile?.token_balance ?? 0);
    userPredictions = (preds ?? []) as Prediction[];
    userTotalOnMarket = userPredictions.reduce((acc, p) => acc + Number(p.amount), 0);
  }

  const probs = displayProbabilities(market, safePool);
  const multipliers = estimatedMultipliers(market, safePool);
  const real = totalRealPool(safePool);
  const predictable = isMarketPredictable(market);

  return (
    <>
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold leading-tight">{market.question}</h1>
          <Badge variant="outline" className="capitalize shrink-0">{market.status}</Badge>
        </div>
        {market.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{market.description}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {market.status === "open" ? "Closes" : "Closed"} {new Date(market.closes_at).toLocaleString()}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current odds</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <OddsBar yesProbability={probs.yes} />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <PoolStat
              label="YES volume"
              value={Number(safePool.yes_pool).toLocaleString()}
              hint={multipliers.yes ? `pays ${multipliers.yes.toFixed(2)}×` : "no YES predictions yet"}
              tone="yes"
            />
            <PoolStat
              label="NO volume"
              value={Number(safePool.no_pool).toLocaleString()}
              hint={multipliers.no ? `pays ${multipliers.no.toFixed(2)}×` : "no NO predictions yet"}
              tone="no"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            Total volume: {real.toLocaleString()} gold
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Place a prediction</CardTitle>
          </CardHeader>
          <CardContent>
            {!userId ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">Sign in to place a prediction.</p>
                <Button asChild size="sm" className="w-fit">
                  <Link href="/auth/login">Sign in</Link>
                </Button>
              </div>
            ) : !predictable ? (
              <p className="text-sm text-muted-foreground">
                This market is {market.status}. Predictions are closed.
              </p>
            ) : (
              <PredictionForm
                market={market}
                pool={safePool}
                userBalance={userBalance}
                userTotalOnMarket={userTotalOnMarket}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your activity</CardTitle>
          </CardHeader>
          <CardContent>
            {!userId ? (
              <p className="text-sm text-muted-foreground">Sign in to see your predictions.</p>
            ) : userPredictions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No predictions on this market yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="text-sm">
                  Total on this market:{" "}
                  <span className="font-medium">{userTotalOnMarket.toLocaleString()}</span> gold
                </div>
                <ul className="text-xs flex flex-col gap-1">
                  {userPredictions.map((p) => (
                    <li key={p.id} className="flex justify-between border-b last:border-b-0 py-1">
                      <span className={p.outcome === "yes" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                        {p.outcome.toUpperCase()} {Number(p.amount).toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">{new Date(p.created_at).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function PoolStat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "yes" | "no";
}) {
  const accent =
    tone === "yes" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-lg font-semibold ${accent}`}>{value}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </div>
  );
}
