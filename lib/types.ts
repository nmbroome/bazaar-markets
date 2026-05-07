export type MarketStatus = "open" | "closed" | "resolved" | "paid" | "cancelled";
export type Outcome = "yes" | "no";
export type ResolutionOutcome = Outcome | "cancelled";
export type Role = "user" | "admin";

export type LedgerReason =
  | "signup_bonus"
  | "prediction_debit"
  | "payout_credit"
  | "refund_credit"
  | "admin_adjustment"
  | "seed_payout";

export interface Profile {
  id: string;
  username: string | null;
  token_balance: number;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface Market {
  id: string;
  question: string;
  description: string | null;
  status: MarketStatus;
  opens_at: string;
  closes_at: string;
  resolved_at: string | null;
  winning_outcome: Outcome | null;
  yes_seed: number;
  no_seed: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketPool {
  market_id: string;
  yes_pool: number;
  no_pool: number;
  yes_prediction_count: number;
  no_prediction_count: number;
  updated_at: string;
}

export interface Prediction {
  id: string;
  user_id: string;
  market_id: string;
  outcome: Outcome;
  amount: number;
  idempotency_key: string | null;
  created_at: string;
}

export interface TokenLedgerEntry {
  id: string;
  user_id: string;
  amount: number;
  reason: LedgerReason;
  market_id: string | null;
  prediction_id: string | null;
  created_at: string;
}

export interface MarketResolution {
  id: string;
  market_id: string;
  winning_outcome: ResolutionOutcome | null;
  resolved_by: string | null;
  reason: string | null;
  created_at: string;
}

export interface Payout {
  id: string;
  user_id: string;
  market_id: string;
  amount: number;
  status: string;
  created_at: string;
}

export type MarketWithPool = Market & { market_pools: MarketPool | null };
