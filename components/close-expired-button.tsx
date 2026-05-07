"use client";

import { useState, useTransition } from "react";

import { closeExpiredAction } from "@/app/admin/_actions";
import { Button } from "@/components/ui/button";

export function CloseExpiredButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await closeExpiredAction();
            setMessage({ ok: res.ok, text: res.message ?? (res.ok ? "Done." : "Failed.") });
          })
        }
      >
        {pending ? "Closing…" : "Close expired markets"}
      </Button>
      {message && (
        <span className={`text-xs ${message.ok ? "text-emerald-600" : "text-destructive"}`}>
          {message.text}
        </span>
      )}
    </div>
  );
}
