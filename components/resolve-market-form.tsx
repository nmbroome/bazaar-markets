"use client";

import { useActionState } from "react";

import { resolveMarketAction, type AdminActionState } from "@/app/admin/_actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AdminActionState = { ok: false };

export function ResolveMarketForm({
  marketId,
  mode = "default",
}: {
  marketId: string;
  mode?: "default" | "collapsible";
}) {
  const [state, formAction, pending] = useActionState(resolveMarketAction, initial);
  const collapsible = mode === "collapsible";
  const form = (
    <form action={formAction} className={`flex flex-col gap-2 ${collapsible ? "mt-3" : "border-t pt-3"}`}>
      <input type="hidden" name="marketId" value={marketId} />
      <div className="flex flex-col gap-1">
        <Label htmlFor={`reason-${marketId}`} className="text-xs">Reason (optional)</Label>
        <Input id={`reason-${marketId}`} name="reason" placeholder="Source / rationale" />
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button
          type="submit"
          name="outcome"
          value="yes"
          size="sm"
          disabled={pending}
          className="bg-emerald-600 hover:bg-emerald-600/90 text-white"
        >
          Resolve YES
        </Button>
        <Button
          type="submit"
          name="outcome"
          value="no"
          size="sm"
          disabled={pending}
          className="bg-rose-600 hover:bg-rose-600/90 text-white"
        >
          Resolve NO
        </Button>
        <Button
          type="submit"
          name="outcome"
          value="cancelled"
          size="sm"
          variant="outline"
          disabled={pending}
        >
          Cancel / void
        </Button>
      </div>
      {state.message && (
        <p className={`text-xs ${state.ok ? "text-emerald-600" : "text-destructive"}`}>
          {state.message}
        </p>
      )}
    </form>
  );

  if (!collapsible) return form;
  return (
    <details className="border-t pt-3">
      <summary className="text-xs cursor-pointer select-none text-muted-foreground hover:text-foreground">
        Close early & resolve
      </summary>
      {form}
    </details>
  );
}
