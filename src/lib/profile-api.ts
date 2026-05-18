import { supabase } from "@/integrations/supabase/client";
import type { ThemePreference } from "@/lib/theme-context";

export type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone?: string | null;
  phone_verified?: boolean | null;
  email_verified?: boolean | null;
  theme_preference?: ThemePreference | null;
  role?: "user" | "host" | "admin" | null;
  created_at: string;
};

export async function fetchMyProfile() {
  if (typeof window === "undefined") return null;

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw error;
  return data as ProfileRow | null;
}

export async function updateThemePreference(theme: ThemePreference) {
  if (typeof window === "undefined") return { ok: false, reason: "server-render" };

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return { ok: false, reason: "not-authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({ theme_preference: theme } as never)
    .eq("id", user.id);
  if (error) throw error;
  return { ok: true };
}
