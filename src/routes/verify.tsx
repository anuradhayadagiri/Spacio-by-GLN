import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, ChevronLeft, Loader2, Mail, Phone } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { sendVerificationCode, verifyCode, type VerificationChannel } from "@/lib/verification-api";

type Search = {
  email?: string;
  phone?: string;
  redirect?: string;
};

export const Route = createFileRoute("/verify")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    email: typeof s.email === "string" ? s.email : undefined,
    phone: typeof s.phone === "string" ? s.phone : undefined,
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({ meta: [{ title: "Verify account - Spacio" }] }),
  component: VerifyPage,
});

function VerifyPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const initialPhone = search.phone?.replace(/^["']|["']$/g, "");
  const [channel, setChannel] = useState<VerificationChannel>(search.phone ? "phone" : "email");
  const [target, setTarget] = useState(initialPhone || search.email || "");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<"dev" | "msg91" | "email" | null>(null);
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await sendVerificationCode(channel, target);
      setDevCode(result.devCode ?? null);
      setDeliveryMode((result.mode as "dev" | "msg91" | undefined) ?? (channel === "email" ? "email" : null));
    } catch (e: any) {
      setError(e.message ?? "Could not send code.");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await verifyCode(channel, target, code);
      setVerified(true);
      window.setTimeout(() => navigate({ to: (search.redirect as never) || "/profile" }), 650);
    } catch (e: any) {
      setError(e.message ?? "Could not verify code.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <main className="relative mx-auto max-w-xl px-5 pt-[calc(env(safe-area-inset-top)+20px)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 rounded-b-[3rem] bg-[var(--gradient-hero)]" />
        <Link to="/login" className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">
          <ChevronLeft className="h-4 w-4" />
          Login
        </Link>

        <section className="mt-5 rounded-3xl border border-white/30 bg-background/95 p-5 shadow-[var(--shadow-elevated)] backdrop-blur-2xl dark:bg-card/85">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            {channel === "email" ? <Mail className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold">Verify your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Confirm email and phone ownership before payments, hosting, and QR/OTP access.
          </p>

          <div className="mt-5 grid grid-cols-2 rounded-2xl bg-muted/60 p-1">
            {(["email", "phone"] as VerificationChannel[]).map((item) => (
              <button
                key={item}
                onClick={() => setChannel(item)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold capitalize ${
                  channel === item ? "bg-background text-primary shadow-[var(--shadow-soft)]" : "text-muted-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {channel === "email" ? "Email address" : "Phone number"}
          </label>
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder={channel === "email" ? "you@example.com" : "+91 98765 43210"}
            className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
          />

          <button
            onClick={send}
            disabled={busy}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-semibold"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Send code
          </button>

          {devCode ? (
            <p className="mt-3 rounded-2xl bg-success/10 px-3 py-2 text-xs text-success">
              Dev code: <span className="font-mono font-semibold">{devCode}</span>. Replace this with SMS/email provider delivery in production.
            </p>
          ) : deliveryMode ? (
            <p className="mt-3 rounded-2xl bg-success/10 px-3 py-2 text-xs text-success">
              OTP sent. Check your {deliveryMode === "msg91" ? "phone" : "email"} and enter the 6-digit code.
            </p>
          ) : null}

          <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            6-digit code
          </label>
          <input
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-center font-mono text-2xl tracking-[0.35em] outline-none focus:border-primary"
            placeholder="000000"
          />

          {error && <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}

          <button
            onClick={confirm}
            disabled={busy || code.length !== 6}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {verified ? <CheckCircle2 className="h-4 w-4" /> : busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {verified ? "Verified" : "Verify and continue"}
          </button>
        </section>
      </main>
    </AppShell>
  );
}
