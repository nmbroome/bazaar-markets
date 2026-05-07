"use client";

import { useState, useTransition } from "react";

import { resolveMarketAction } from "@/app/admin/_actions";
import { Button } from "@/components/ui/button";

export function CancelMarketButton({
  marketId,
  question,
}: {
  marketId: string;
  question: string;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div className="flex items-center gap-3 border-t pt-3">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={() => {
          const confirmed = window.confirm(
            `Cancel market "${question}"?\n\nThis refunds every prediction 1:1 and sets the market to cancelled. The action cannot be undone.`,
          );
          if (!confirmed) return;
          const reason = window.prompt("Reason (optional, shown in the audit trail):") ?? "";
          startTransition(async () => {
            const fd = new FormData();
            fd.set("marketId", marketId);
            fd.set("outcome", "cancelled");
            fd.set("reason", reason);
            const res = await resolveMarketAction({ ok: false }, fd);
            setMessage({ ok: res.ok, text: res.message ?? (res.ok ? "Done." : "Failed.") });
          });
        }}
      >
        {pending ? "Cancelling…" : "Cancel market"}
      </Button>
      {message && (
        <span className={`text-xs ${message.ok ? "text-emerald-600" : "text-destructive"}`}>
          {message.text}
        </span>
      )}
    </div>
  );
}
