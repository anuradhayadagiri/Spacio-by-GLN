import { supabase } from "@/integrations/supabase/client";
import {
  sendVerificationChallenge,
  verifyVerificationChallenge,
  type VerificationChannel,
} from "@/lib/verification.functions";

export type { VerificationChannel };

const codeStore = new Map<string, { code: string; expiresAt: number }>();

const keyFor = (channel: VerificationChannel, target: string) => `${channel}:${target}`;

export async function sendVerificationCode(channel: VerificationChannel, target: string) {
  if (!target.trim()) throw new Error(`Enter a valid ${channel}.`);

  const { data: auth } =
    typeof window !== "undefined" ? await supabase.auth.getUser() : { data: { user: null } };

  try {
    return await sendVerificationChallenge({
      data: { channel, target, user_id: auth.user?.id },
    });
  } catch (e: any) {
    if (channel === "phone") {
      throw new Error(e.message ?? "Could not send phone OTP.");
    }
    // Email keeps a local fallback until email provider configuration is complete.
  }

  if (channel === "email" && typeof window !== "undefined") {
    const { error } = await supabase.auth.signInWithOtp({
      email: target,
      options: { shouldCreateUser: true, emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  codeStore.set(keyFor(channel, target), { code, expiresAt: Date.now() + 5 * 60 * 1000 });
  return { ok: true, devCode: code, expiresIn: 300, mode: "dev" as const };
}

export async function verifyCode(channel: VerificationChannel, target: string, code: string) {
  const { data: auth } =
    typeof window !== "undefined" ? await supabase.auth.getUser() : { data: { user: null } };

  try {
    return await verifyVerificationChallenge({
      data: { channel, target, code, user_id: auth.user?.id },
    });
  } catch (e: any) {
    if (channel === "phone") {
      throw new Error(e.message ?? "Could not verify phone OTP.");
    }
    // Email falls through to local dev-code verification.
  }

  const saved = codeStore.get(keyFor(channel, target));
  if (!saved) throw new Error("Request a fresh verification code.");
  if (Date.now() > saved.expiresAt) throw new Error("Code expired. Request a new one.");
  if (saved.code !== code) throw new Error("Invalid verification code.");

  codeStore.delete(keyFor(channel, target));
  return { ok: true };
}
