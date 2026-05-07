"use client";

import { useActionState } from "react";

import { updateUsernameAction, type ProfileActionState } from "@/app/profile/_actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ProfileActionState = { ok: false };

export function ProfileForm({ currentUsername }: { currentUsername: string }) {
  const [state, formAction, pending] = useActionState(updateUsernameAction, initial);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          defaultValue={currentUsername}
          minLength={3}
          maxLength={32}
          required
        />
        <p className="text-xs text-muted-foreground">
          3&ndash;32 characters. Shown on markets and the leaderboard.
        </p>
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Save username"}
      </Button>
      {state.message && (
        <p className={`text-sm ${state.ok ? "text-emerald-600" : "text-destructive"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
