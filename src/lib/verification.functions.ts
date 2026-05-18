import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type VerificationChannel = "email" | "phone";

const normalizeTarget = (target: string) => target.trim().toLowerCase();
const msg91BaseUrl = "https://control.msg91.com/api/v5/otp";
const missingRelationCodes = new Set(["42P01", "PGRST205", "PGRST116"]);

function normalizePhoneForMsg91(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function isMsg91Configured() {
  return Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_OTP_TEMPLATE_ID);
}

function isMissingRelationError(error: any) {
  return missingRelationCodes.has(error?.code) || String(error?.message ?? "").includes("Could not find the table");
}

async function parseMsg91Response(response: Response) {
  const text = await response.text();
  let payload: any = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { message: text };
  }

  if (!response.ok || payload?.type === "error") {
    const providerMessage = payload?.message || payload?.msg || "MSG91 OTP request failed.";
    const readableMessage = String(providerMessage).toLowerCase();

    if (
      readableMessage.includes("flow id") ||
      readableMessage.includes("template id") ||
      readableMessage.includes("template_id")
    ) {
      throw new Error(
        "MSG91 OTP template ID is invalid. In MSG91, copy the Template ID from OTP > Templates / SendOTP, not a Flow ID or DLT template ID.",
      );
    }

    throw new Error(providerMessage);
  }

  return payload;
}

async function sendMsg91Otp(target: string, code: string) {
  const mobile = normalizePhoneForMsg91(target);
  const params = new URLSearchParams({
    template_id: process.env.MSG91_OTP_TEMPLATE_ID!,
    mobile,
    otp: code,
  });

  if (process.env.MSG91_OTP_EXPIRY_MINUTES) {
    params.set("otp_expiry", process.env.MSG91_OTP_EXPIRY_MINUTES);
  }

  if (process.env.MSG91_OTP_LENGTH) {
    params.set("otp_length", process.env.MSG91_OTP_LENGTH);
  }

  const response = await fetch(`${msg91BaseUrl}?${params.toString()}`, {
    method: "POST",
    headers: {
      authkey: process.env.MSG91_AUTH_KEY!,
      "content-type": "application/json",
    },
  });

  return parseMsg91Response(response);
}

async function verifyMsg91Otp(target: string, code: string) {
  const mobile = normalizePhoneForMsg91(target);
  const params = new URLSearchParams({ mobile, otp: code });
  const response = await fetch(`${msg91BaseUrl}/verify?${params.toString()}`, {
    method: "GET",
    headers: { authkey: process.env.MSG91_AUTH_KEY! },
  });

  return parseMsg91Response(response);
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function createDevCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const sendVerificationChallenge = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { channel: VerificationChannel; target: string; user_id?: string }) => input,
  )
  .handler(async ({ data }) => {
    const target = normalizeTarget(data.target);
    if (!target) throw new Error(`Enter a valid ${data.channel}.`);

    const code = createDevCode();
    const targetHash = await sha256(`${data.channel}:${target}`);
    const codeHash = await sha256(`${targetHash}:${code}`);
    const useMsg91 = data.channel === "phone" && isMsg91Configured();
    const providerResponse = useMsg91 ? await sendMsg91Otp(target, code) : null;

    const { error } = await (supabaseAdmin as any).from("verification_attempts").insert({
      user_id: data.user_id ?? null,
      channel: data.channel,
      target_hash: targetHash,
      code_hash: codeHash,
      status: "pending",
      provider: useMsg91 ? "msg91" : "dev",
      provider_message_id:
        providerResponse?.request_id || providerResponse?.message || `dev_${Date.now()}`,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    } as never);

    if (error && !(useMsg91 && isMissingRelationError(error))) throw error;

    return {
      ok: true,
      devCode: useMsg91 ? undefined : code,
      expiresIn: 300,
      mode: useMsg91 ? ("msg91" as const) : ("dev" as const),
      persistence: error ? ("pending-migrations" as const) : ("stored" as const),
    };
  });

export const verifyVerificationChallenge = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { channel: VerificationChannel; target: string; code: string; user_id?: string }) =>
      input,
  )
  .handler(async ({ data }) => {
    const target = normalizeTarget(data.target);
    const code = data.code.trim();
    if (!target || code.length !== 6) throw new Error("Enter a valid verification code.");

    const targetHash = await sha256(`${data.channel}:${target}`);
    const codeHash = await sha256(`${targetHash}:${code}`);
    const useMsg91 = data.channel === "phone" && isMsg91Configured();

    const { data: attempt, error } = await (supabaseAdmin as any)
      .from("verification_attempts")
      .select("id, user_id, code_hash, attempts, expires_at")
      .eq("channel", data.channel)
      .eq("target_hash", targetHash)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && !(useMsg91 && isMissingRelationError(error))) throw error;
    if (error && useMsg91 && isMissingRelationError(error)) {
      await verifyMsg91Otp(target, code);

      if (data.user_id) {
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .update({ phone_verified: true, phone: target } as never)
          .eq("id", data.user_id);
        if (profileError && !isMissingRelationError(profileError)) throw profileError;
      }

      return { ok: true, persistence: "pending-migrations" as const };
    }
    if (!attempt) throw new Error("Request a fresh verification code.");

    if (new Date((attempt as any).expires_at).getTime() < Date.now()) {
      await (supabaseAdmin as any)
        .from("verification_attempts")
        .update({ status: "expired" } as never)
        .eq("id", (attempt as any).id);
      throw new Error("Code expired. Request a new one.");
    }

    if (useMsg91) {
      await verifyMsg91Otp(target, code);
    }

    if (!useMsg91 && (attempt as any).code_hash !== codeHash) {
      await (supabaseAdmin as any)
        .from("verification_attempts")
        .update({ attempts: Number((attempt as any).attempts ?? 0) + 1 } as never)
        .eq("id", (attempt as any).id);
      throw new Error("Invalid verification code.");
    }

    const userId = data.user_id ?? ((attempt as any).user_id as string | undefined);
    await (supabaseAdmin as any)
      .from("verification_attempts")
      .update({ status: "verified", verified_at: new Date().toISOString() } as never)
      .eq("id", (attempt as any).id);

    if (userId) {
      await supabaseAdmin
        .from("profiles")
        .update(
          data.channel === "email"
            ? ({ email_verified: true } as never)
            : ({ phone_verified: true, phone: target } as never),
        )
        .eq("id", userId);
    }

    return { ok: true };
  });
