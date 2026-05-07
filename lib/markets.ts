import type { Market, MarketPool, Outcome } from "@/lib/types";

export interface DisplayProbabilities {
  yes: number;
  no: number;
}

export interface PoolInputs {
  yesPool: number;
  noPool: number;
  yesSeed: number;
  noSeed: number;
}

function poolInputs(market: Pick<Market, "yes_seed" | "no_seed">, pool: Pick<MarketPool, "yes_pool" | "no_pool">): PoolInputs {
  return {
    yesPool: Number(pool.yes_pool),
    noPool: Number(pool.no_pool),
    yesSeed: Number(market.yes_seed),
    noSeed: Number(market.no_seed),
  };
}

/**
 * Displayed probabilities derived from real volume only. Defaults to 50/50 when
 * the market has no real volume. Seeds are ignored here intentionally; to
 * re-enable seed-influenced odds in the future, restore the seed-aware formula.
 */
export function displayProbabilities(
  _market: Pick<Market, "yes_seed" | "no_seed">,
  pool: Pick<MarketPool, "yes_pool" | "no_pool">,
): DisplayProbabilities {
  const yesPool = Number(pool.yes_pool);
  const noPool = Number(pool.no_pool);
  const total = yesPool + noPool;
  if (total <= 0) return { yes: 0.5, no: 0.5 };
  return {
    yes: yesPool / total,
    no: noPool / total,
  };
}

/**
 * Estimated payout multiplier per outcome side. Computed from real volume only
 * (seeds do not flow into payouts). Returns null when that side has no real
 * predictions yet.
 */
export function estimatedMultipliers(
  market: Pick<Market, "yes_seed" | "no_seed">,
  pool: Pick<MarketPool, "yes_pool" | "no_pool">,
): { yes: number | null; no: number | null } {
  const { yesPool, noPool } = poolInputs(market, pool);
  const total = yesPool + noPool;
  return {
    yes: yesPool > 0 ? total / yesPool : null,
    no: noPool > 0 ? total / noPool : null,
  };
}

/**
 * Estimated payout for a single user contribution on `outcome`, given the
 * current pool state. Seeds are not part of the payout pool — they only affect
 * displayed odds — so a winner with no opposing bets just gets their stake back.
 *
 * NOTE: this is a UI preview only. Authoritative payout math lives in the
 * `resolve_market` Postgres function.
 */
export function estimateUserPayout(
  market: Pick<Market, "yes_seed" | "no_seed">,
  pool: Pick<MarketPool, "yes_pool" | "no_pool">,
  outcome: Outcome,
  contribution: number,
): number {
  const { yesPool, noPool } = poolInputs(market, pool);
  if (contribution <= 0) return 0;

  const winningPool = (outcome === "yes" ? yesPool : noPool) + contribution;
  if (winningPool <= 0) return 0;
  const losingPool = outcome === "yes" ? noPool : yesPool;
  const distributable = winningPool + losingPool;
  return (contribution / winningPool) * distributable;
}

export function totalRealPool(pool: Pick<MarketPool, "yes_pool" | "no_pool">): number {
  return Number(pool.yes_pool) + Number(pool.no_pool);
}

export function isMarketPredictable(market: Pick<Market, "status" | "opens_at" | "closes_at">, now = new Date()): boolean {
  if (market.status !== "open") return false;
  const opens = new Date(market.opens_at).getTime();
  const closes = new Date(market.closes_at).getTime();
  const t = now.getTime();
  return t >= opens && t < closes;
}
