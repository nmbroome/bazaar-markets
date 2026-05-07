"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type ProfileActionState = { ok: boolean; message?: string };

export async function updateUsernameAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const username = String(formData.get("username") ?? "").trim();

  if (username.length < 3) return { ok: false, message: "Username must be at least 3 characters." };
  if (username.length > 32) return { ok: false, message: "Username must be 32 characters or fewer." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_username", { p_username: username });
  if (error) return { ok: false, message: friendly(error.message) };

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { ok: true, message: "Username updated." };
}

function friendly(raw: string): string {
  const code = raw.split("\n")[0]?.trim() ?? raw;
  switch (code) {
    case "not_authenticated":
      return "You need to sign in.";
    case "username_too_short":
      return "Username must be at least 3 characters.";
    case "username_too_long":
      return "Username must be 32 characters or fewer.";
    case "profile_not_found":
      return "Profile not found.";
    default:
      return raw;
  }
}
