import { Suspense } from "react";

import { MarketCard } from "@/components/market-card";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/server";
import type { Market, MarketPool } from "@/lib/types";

type MarketRow = Market & { market_pools: MarketPool | MarketPool[] | null };

function pickPool(row: MarketRow): MarketPool | null {
  if (!row.market_pools) return null;
  return Array.isArray(row.market_pools) ? row.market_pools[0] ?? null : row.market_pools;
}

export default function HomePage() {
  return (
    <SiteShell>
      <div className="flex flex-col gap-10 py-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Markets</h1>
          <p className="text-sm text-muted-foreground">
            Predict outcomes with gold. New users start with 1,000.
          </p>
        </header>

        <Suspense fallback={<MarketsLoading />}>
          <MarketsList />
        </Suspense>
      </div>
    </SiteShell>
  );
}

async function MarketsList() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("markets")
    .select("*, market_pools(*)")
    .order("status", { ascending: true })
    .order("closes_at", { ascending: true });

  if (error) {
    return (
      <div className="text-sm text-destructive border border-destructive/30 rounded-md p-3">
        Failed to load markets: {error.message}
      </div>
    );
  }

  const rows = (data ?? []) as MarketRow[];
  const open = rows.filter((m) => m.status === "open");
  const closed = rows.filter((m) => m.status === "closed");
  const resolved = rows.filter((m) => m.status === "resolved" || m.status === "paid");
  const cancelled = rows.filter((m) => m.status === "cancelled");

  return (
    <>
      <Section title="Open" markets={open} emptyHint="No open markets right now." />
      {closed.length > 0 && (
        <Section title="Closed (awaiting resolution)" markets={closed} />
      )}
      {resolved.length > 0 && <Section title="Resolved" markets={resolved} />}
      {cancelled.length > 0 && <Section title="Cancelled" markets={cancelled} />}
    </>
  );
}

function MarketsLoading() {
  return (
    <div className="text-sm text-muted-foreground">Loading markets…</div>
  );
}

function Section({
  title,
  markets,
  emptyHint,
}: {
  title: string;
  markets: MarketRow[];
  emptyHint?: string;
}) {
  if (markets.length === 0 && !emptyHint) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">{title}</h2>
      {markets.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {markets.map((m) => (
            <MarketCard key={m.id} market={m} pool={pickPool(m)} />
          ))}
        </div>
      )}
    </section>
  );
}
