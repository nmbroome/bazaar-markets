"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { ECONOMY_CONFIG } from "@/lib/economy";

export type PlacePredictionState = {
  ok: boolean;
  message?: string;
};

export async function placePredictionAction(
  _prev: PlacePredictionState,
  formData: FormData,
): Promise<PlacePredictionState> {
  const marketId = String(formData.get("marketId") ?? "");
  const outcome = String(formData.get("outcome") ?? "");
  const amountRaw = String(formData.get("amount") ?? "");
  const idempotencyKey = String(formData.get("idempotencyKey") ?? "");

  if (!marketId) return { ok: false, message: "Missing market id." };
  if (outcome !== "yes" && outcome !== "no") {
    return { ok: false, message: "Outcome must be YES or NO." };
  }
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount < ECONOMY_CONFIG.MIN_PREDICTION_AMOUNT) {
    return { ok: false, message: `Minimum prediction is ${ECONOMY_CONFIG.MIN_PREDICTION_AMOUNT} gold.` };
  }
  if (amount > ECONOMY_CONFIG.MAX_PREDICTION_PER_MARKET) {
    return { ok: false, message: `Maximum is ${ECONOMY_CONFIG.MAX_PREDICTION_PER_MARKET} per market.` };
  }
  if (!idempotencyKey) {
    return { ok: false, message: "Missing idempotency key." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("place_prediction", {
    p_market_id: marketId,
    p_outcome: outcome,
    p_amount: amount,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    return { ok: false, message: friendlyError(error.message) };
  }

  revalidatePath(`/markets/${marketId}`);
  revalidatePath("/dashboard");
  revalidatePath("/");
  return { ok: true, message: `Prediction placed: ${amount} on ${outcome.toUpperCase()}.` };
}

function friendlyError(raw: string): string {
  const code = raw.split("\n")[0]?.trim() ?? raw;
  switch (code) {
    case "not_authenticated":
      return "You need to sign in to place a prediction.";
    case "market_not_open":
      return "This market is not open for predictions.";
    case "market_outside_window":
      return "This market is outside its prediction window.";
    case "amount_below_minimum":
      return `Minimum prediction is ${ECONOMY_CONFIG.MIN_PREDICTION_AMOUNT} gold.`;
    case "exceeds_max_per_market":
      return `You'd exceed the ${ECONOMY_CONFIG.MAX_PREDICTION_PER_MARKET}-gold cap per market.`;
    case "insufficient_balance":
      return "Insufficient gold.";
    case "market_not_found":
      return "Market not found.";
    case "invalid_outcome":
      return "Invalid outcome.";
    default:
      return raw;
  }
}
