"use client";

import { useActionState, useState } from "react";

import { updateMarketAction, type AdminActionState } from "@/app/admin/_actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AdminActionState = { ok: false };

interface EditMarketFormProps {
  marketId: string;
  question: string;
  description: string | null;
  closesAt: string; // ISO timestamp
}

// Convert ISO -> "YYYY-MM-DDTHH:mm" in the user's local timezone, which is what
// <input type="datetime-local"> expects.
function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// datetime-local has no timezone. Re-anchor it in the browser's TZ and emit ISO
// so the server doesn't reinterpret the wall-clock time in its own timezone.
function localInputToIso(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export function EditMarketForm({ marketId, question, description, closesAt }: EditMarketFormProps) {
  const [state, formAction, pending] = useActionState(updateMarketAction, initial);
  const [closesAtLocal, setClosesAtLocal] = useState(() => toLocalInputValue(closesAt));
  return (
    <details className="border-t pt-3">
      <summary className="text-xs cursor-pointer select-none text-muted-foreground hover:text-foreground">
        Edit market
      </summary>
      <form action={formAction} className="flex flex-col gap-3 mt-3">
        <input type="hidden" name="marketId" value={marketId} />
        <div className="flex flex-col gap-1">
          <Label htmlFor={`q-${marketId}`} className="text-xs">Question</Label>
          <Input
            id={`q-${marketId}`}
            name="question"
            defaultValue={question}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`d-${marketId}`} className="text-xs">Description</Label>
          <textarea
            id={`d-${marketId}`}
            name="description"
            rows={3}
            defaultValue={description ?? ""}
            className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`c-${marketId}`} className="text-xs">Closes at</Label>
          <input type="hidden" name="closesAt" value={localInputToIso(closesAtLocal)} />
          <Input
            id={`c-${marketId}`}
            type="datetime-local"
            value={closesAtLocal}
            onChange={(e) => setClosesAtLocal(e.target.value)}
            required
          />
        </div>
        <Button type="submit" size="sm" disabled={pending} className="w-fit">
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {state.message && (
          <p className={`text-xs ${state.ok ? "text-emerald-600" : "text-destructive"}`}>
            {state.message}
          </p>
        )}
      </form>
    </details>
  );
}
