"use client";

import { useActionState } from "react";

import { createMarketAction, type AdminActionState } from "@/app/admin/_actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AdminActionState = { ok: false };

export function CreateMarketForm() {
  const [state, formAction, pending] = useActionState(createMarketAction, initial);
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
        <Input id="closesAt" name="closesAt" type="datetime-local" required />
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
