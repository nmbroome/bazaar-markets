"use client";

import { useActionState, useEffect, useMemo, useState } from "react";

import { placePredictionAction, type PlacePredictionState } from "@/app/markets/[id]/_actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ECONOMY_CONFIG } from "@/lib/economy";
import { estimateUserPayout } from "@/lib/markets";
import type { Market, MarketPool, Outcome } from "@/lib/types";

interface PredictionFormProps {
  market: Pick<Market, "id" | "yes_seed" | "no_seed">;
  pool: Pick<MarketPool, "yes_pool" | "no_pool">;
  userBalance: number;
  userTotalOnMarket: number;
}

const initialState: PlacePredictionState = { ok: false };

export function PredictionForm({ market, pool, userBalance, userTotalOnMarket }: PredictionFormProps) {
  const [state, formAction, pending] = useActionState(placePredictionAction, initialState);
  const [outcome, setOutcome] = useState<Outcome>("yes");
  const [amount, setAmount] = useState<number>(ECONOMY_CONFIG.MIN_PREDICTION_AMOUNT);
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");

  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
  }, []);

  // Rotate the idempotency key after a successful submit so the next prediction
  // is treated as a new request rather than a replay.
  useEffect(() => {
    if (state.ok) setIdempotencyKey(crypto.randomUUID());
  }, [state.ok]);

  const remainingPerMarket = Math.max(
    0,
    ECONOMY_CONFIG.MAX_PREDICTION_PER_MARKET - userTotalOnMarket,
  );
  const maxThisBet = Math.min(remainingPerMarket, userBalance);
  const tooLow = amount < ECONOMY_CONFIG.MIN_PREDICTION_AMOUNT;
  const tooHigh = amount > maxThisBet;

  const estimatedMultiplier = useMemo(() => {
    const a = Number.isFinite(amount) ? amount : 0;
    if (a <= 0) return 0;
    return estimateUserPayout(market, pool, outcome, a) / a;
  }, [market, pool, outcome, amount]);

  const disabled = pending || tooLow || tooHigh || maxThisBet < ECONOMY_CONFIG.MIN_PREDICTION_AMOUNT;

  return (
    <form action={formAction} className="flex flex-col gap-4 border rounded-md p-4">
      <input type="hidden" name="marketId" value={market.id} />
      <input type="hidden" name="outcome" value={outcome} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={outcome === "yes" ? "default" : "outline"}
          onClick={() => setOutcome("yes")}
          className={outcome === "yes" ? "bg-emerald-600 hover:bg-emerald-600/90 text-white" : ""}
        >
          YES
        </Button>
        <Button
          type="button"
          variant={outcome === "no" ? "default" : "outline"}
          onClick={() => setOutcome("no")}
          className={outcome === "no" ? "bg-rose-600 hover:bg-rose-600/90 text-white" : ""}
        >
          NO
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="amount">Amount (gold)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min={ECONOMY_CONFIG.MIN_PREDICTION_AMOUNT}
          max={maxThisBet}
          step={1}
          value={Number.isFinite(amount) ? amount : ""}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <div className="text-xs text-muted-foreground flex justify-between">
          <span>
            Min {ECONOMY_CONFIG.MIN_PREDICTION_AMOUNT} &middot; Max this bet {maxThisBet}
          </span>
          <span>Balance: {userBalance.toLocaleString()}</span>
        </div>
      </div>

      <div className="text-sm flex justify-between border-t pt-3">
        <span className="text-muted-foreground">If {outcome.toUpperCase()} wins</span>
        <span className="font-medium">
          {estimatedMultiplier > 0 ? `${estimatedMultiplier.toFixed(2)}×` : "—"}
        </span>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Estimate only &mdash; finalised at resolution as more predictions arrive.
      </p>

      <Button type="submit" disabled={disabled}>
        {pending ? "Placing…" : `Place ${amount || 0} on ${outcome.toUpperCase()}`}
      </Button>

      {state.message && (
        <p className={`text-sm ${state.ok ? "text-emerald-600" : "text-destructive"}`}>
          {state.message}
        </p>
      )}

      {maxThisBet < ECONOMY_CONFIG.MIN_PREDICTION_AMOUNT && (
        <p className="text-xs text-muted-foreground">
          {userBalance < ECONOMY_CONFIG.MIN_PREDICTION_AMOUNT
            ? "You don't have enough gold to place a prediction."
            : `You've reached the ${ECONOMY_CONFIG.MAX_PREDICTION_PER_MARKET}-gold cap on this market.`}
        </p>
      )}
    </form>
  );
}
