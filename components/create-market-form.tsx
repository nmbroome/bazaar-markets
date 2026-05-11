"use client";

import { useActionState, useState } from "react";

import { createMarketAction, type AdminActionState } from "@/app/admin/_actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AdminActionState = { ok: false };

// datetime-local has no timezone. Re-anchor it in the browser's TZ and emit ISO
// so the server doesn't reinterpret the wall-clock time in its own timezone.
function localInputToIso(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export function CreateMarketForm() {
  const [state, formAction, pending] = useActionState(createMarketAction, initial);
  const [closesAtLocal, setClosesAtLocal] = useState("");
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="question">Question</Label>
        <Input id="question" name="question" required placeholder="Will X happen by Y?" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="description">Description (optional)</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Resolution criteria, sources, edge cases…"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="closesAt">Closes at</Label>
        <input type="hidden" name="closesAt" value={localInputToIso(closesAtLocal)} />
        <Input
          id="closesAt"
          type="datetime-local"
          value={closesAtLocal}
          onChange={(e) => setClosesAtLocal(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Creating…" : "Create market"}
      </Button>
      {state.message && (
        <p className={`text-sm ${state.ok ? "text-emerald-600" : "text-destructive"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
