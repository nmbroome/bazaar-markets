import Link from "next/link";

import { OddsBar } from "@/components/odds-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { displayProbabilities, totalRealPool } from "@/lib/markets";
import type { Market, MarketPool, MarketStatus } from "@/lib/types";

const statusVariant: Record<MarketStatus, "default" | "secondary" | "outline" | "destructive"> = {
  open: "default",
  closed: "secondary",
  resolved: "secondary",
  paid: "outline",
  cancelled: "destructive",
};

interface MarketCardProps {
  market: Market;
  pool: MarketPool | null;
}

export function MarketCard({ market, pool }: MarketCardProps) {
  const safePool: MarketPool = pool ?? {
    market_id: market.id,
    yes_pool: 0,
    no_pool: 0,
    yes_prediction_count: 0,
    no_prediction_count: 0,
    updated_at: market.created_at,
  };
  const probs = displayProbabilities(market, safePool);
  const real = totalRealPool(safePool);
  const closesAt = new Date(market.closes_at);
  const closesLabel = closesAt.toLocaleString();

  return (
    <Link href={`/markets/${market.id}`} className="block">
      <Card className="hover:border-foreground/30 transition-colors">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-base leading-snug">{market.question}</CardTitle>
            <Badge variant={statusVariant[market.status]} className="capitalize shrink-0">
              {market.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <OddsBar yesProbability={probs.yes} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Volume: {real.toLocaleString()} gold</span>
            <span>
              {market.status === "open" ? "Closes" : "Closed"} {closesLabel}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
