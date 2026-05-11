import { Suspense } from "react";

import { CancelMarketButton } from "@/components/cancel-market-button";
import { CloseExpiredButton } from "@/components/close-expired-button";
import { CreateMarketForm } from "@/components/create-market-form";
import { EditMarketForm } from "@/components/edit-market-form";
import { ResolveMarketForm } from "@/components/resolve-market-form";
import { SiteShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { displayProbabilities, totalRealPool } from "@/lib/markets";
import { createClient } from "@/lib/supabase/server";
import type { Market, MarketPool } from "@/lib/types";

type Row = Market & { market_pools: MarketPool | MarketPool[] | null };

function pickPool(row: Row): MarketPool | null {
  if (!row.market_pools) return null;
  return Array.isArray(row.market_pools) ? row.market_pools[0] ?? null : row.market_pools;
}

export default function AdminPage() {
  return (
    <SiteShell>
      <div className="flex flex-col gap-8 py-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Admin</h1>
          <p className="text-sm text-muted-foreground">Create markets, close expired ones, and resolve.</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create market</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateMarketForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <CloseExpiredButton />
          </CardContent>
        </Card>

        <Suspense fallback={<AdminMarketsLoading />}>
          <AdminMarketsList />
        </Suspense>
      </div>
    </SiteShell>
  );
}

function AdminMarketsLoading() {
  return <div className="text-sm text-muted-foreground">Loading markets…</div>;
}

async function AdminMarketsList() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("markets")
    .select("*, market_pools(*)")
    .order("created_at", { ascending: false });

  const markets = (data ?? []) as Row[];
  const closed = markets.filter((m) => m.status === "closed" || m.status === "resolved");
  const open = markets.filter((m) => m.status === "open");
  const terminal = markets.filter((m) => m.status === "paid" || m.status === "cancelled");

  return (
    <>
      <Section title="Awaiting resolution" rows={closed} editable resolvable />
      <Section title="Open" rows={open} editable cancellable closeEarly />
      <Section title="Resolved / cancelled" rows={terminal} />
    </>
  );
}

function Section({
  title,
  rows,
  resolvable = false,
  editable = false,
  cancellable = false,
  closeEarly = false,
}: {
  title: string;
  rows: Row[];
  resolvable?: boolean;
  editable?: boolean;
  cancellable?: boolean;
  closeEarly?: boolean;
}) {
  if (rows.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">{title}</h2>
      <div className="flex flex-col gap-3">
        {rows.map((m) => {
          const pool = pickPool(m);
          const safe: MarketPool = pool ?? {
            market_id: m.id,
            yes_pool: 0,
            no_pool: 0,
            yes_prediction_count: 0,
            no_prediction_count: 0,
            updated_at: m.created_at,
          };
          const probs = displayProbabilities(m, safe);
          return (
            <Card key={m.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-sm leading-snug">{m.question}</CardTitle>
                  <Badge variant="outline" className="capitalize shrink-0">{m.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-xs text-muted-foreground">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Stat label="YES odds" value={`${Math.round(probs.yes * 100)}%`} />
                  <Stat label="Real pool" value={totalRealPool(safe).toLocaleString()} />
                  <Stat label="Closes" value={new Date(m.closes_at).toLocaleString()} />
                  <Stat
                    label="Resolved"
                    value={m.resolved_at ? new Date(m.resolved_at).toLocaleString() : "—"}
                  />
                </div>
                {editable && (
                  <EditMarketForm
                    marketId={m.id}
                    question={m.question}
                    description={m.description}
                    closesAt={m.closes_at}
                  />
                )}
                {resolvable && <ResolveMarketForm marketId={m.id} />}
                {closeEarly && <ResolveMarketForm marketId={m.id} mode="collapsible" />}
                {cancellable && <CancelMarketButton marketId={m.id} question={m.question} />}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="uppercase tracking-wide text-[10px]">{label}</span>
      <span className="text-foreground text-sm">{value}</span>
    </div>
  );
}
