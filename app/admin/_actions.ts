"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type AdminActionState = { ok: boolean; message?: string };

async function requireAdmin() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return { supabase, error: "Not signed in." } as const;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.role !== "admin") return { supabase, error: "Admin only." } as const;
  return { supabase, userId } as const;
}

export async function createMarketAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, message: auth.error };

  const question = String(formData.get("question") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const closesAtRaw = String(formData.get("closesAt") ?? "");

  if (!question) return { ok: false, message: "Question is required." };
  if (!closesAtRaw) return { ok: false, message: "Close time is required." };
  const closesAt = new Date(closesAtRaw);
  if (Number.isNaN(closesAt.getTime())) return { ok: false, message: "Close time is invalid." };
  if (closesAt.getTime() <= Date.now()) {
    return { ok: false, message: "Close time must be in the future." };
  }

  const { error } = await auth.supabase.from("markets").insert({
    question,
    description,
    closes_at: closesAt.toISOString(),
    // Seed liquidity is temporarily disabled; revert to ECONOMY_CONFIG defaults
    // (DEFAULT_YES_SEED / DEFAULT_NO_SEED) when re-enabling.
    yes_seed: 0,
    no_seed: 0,
    created_by: auth.userId,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, message: "Market created." };
}

export async function resolveMarketAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, message: auth.error };

  const marketId = String(formData.get("marketId") ?? "");
  const outcome = String(formData.get("outcome") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!marketId) return { ok: false, message: "Missing market id." };
  if (!["yes", "no", "cancelled"].includes(outcome)) {
    return { ok: false, message: "Outcome must be yes, no, or cancelled." };
  }

  const { error } = await auth.supabase.rpc("resolve_market", {
    p_market_id: marketId,
    p_winning_outcome: outcome,
    p_reason: reason,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/markets/${marketId}`);
  revalidatePath("/dashboard");
  return { ok: true, message: `Market resolved: ${outcome}.` };
}

export async function updateMarketAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, message: auth.error };

  const marketId = String(formData.get("marketId") ?? "");
  const question = String(formData.get("question") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const closesAtRaw = String(formData.get("closesAt") ?? "");

  if (!marketId) return { ok: false, message: "Missing market id." };
  if (!question) return { ok: false, message: "Question is required." };
  if (!closesAtRaw) return { ok: false, message: "Close time is required." };
  const closesAt = new Date(closesAtRaw);
  if (Number.isNaN(closesAt.getTime())) return { ok: false, message: "Close time is invalid." };

  const { data: existing, error: readErr } = await auth.supabase
    .from("markets")
    .select("status, opens_at")
    .eq("id", marketId)
    .maybeSingle();
  if (readErr) return { ok: false, message: readErr.message };
  if (!existing) return { ok: false, message: "Market not found." };
  if (existing.status === "paid" || existing.status === "cancelled") {
    return { ok: false, message: "Cannot edit a market that has been paid out or cancelled." };
  }
  if (closesAt.getTime() <= new Date(existing.opens_at).getTime()) {
    return { ok: false, message: "Close time must be after the market's open time." };
  }

  const { error } = await auth.supabase
    .from("markets")
    .update({
      question,
      description,
      closes_at: closesAt.toISOString(),
    })
    .eq("id", marketId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/markets/${marketId}`);
  return { ok: true, message: "Market updated." };
}

export async function closeExpiredAction(): Promise<AdminActionState> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, message: auth.error };

  const { data, error } = await auth.supabase.rpc("close_expired_markets");
  if (error) return { ok: false, message: error.message };

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, message: `Closed ${data ?? 0} market${data === 1 ? "" : "s"}.` };
}
