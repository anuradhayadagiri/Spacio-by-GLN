import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, Phone, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Search = { redirect?: string };

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: search.redirect ?? "/" });
  },
  head: () => ({ meta: [{ title: "Sign in — Spacio" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"user" | "host">("user");
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name || email.split("@")[0], phone, role },
          },
        });
        if (error) {
          const message = error.message.toLowerCase();
          if (message.includes("already registered") || message.includes("already exists")) {
            setMode("signin");
            throw new Error(
              "This email already has an account. I switched you to Sign in. Use the original password, send an email login link, or reset the password.",
            );
          }
          throw error;
        }
        navigate({
          to: "/verify",
          search: {
            email,
            phone: phone || undefined,
            redirect: search.redirect ?? "/profile",
          } as never,
        });
        return;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          const message = error.message.toLowerCase();
          if (message.includes("invalid login credentials")) {
            throw new Error(
              "Invalid credentials. Use the original password, send an email login link, or reset your password.",
            );
          }
          throw error;
        }
      }
      navigate({ to: search.redirect ?? "/" });
    } catch (e: any) {
      setErr(e.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const sendEmailLink = async () => {
    setErr(null);
    setInfo(null);
    if (!email.trim()) {
      setErr("Enter your email address first.");
      return;
    }

    setBusy(true);
    try {
      const redirectPath = search.redirect ?? "/profile";
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}${redirectPath}`,
        },
      });
      if (error) throw error;
      setInfo("Login link sent. Check your email and continue back to Spacio.");
    } catch (e: any) {
      setErr(e.message ?? "Could not send login link.");
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    setErr(null);
    setInfo(null);
    if (!email.trim()) {
      setErr("Enter your email address first.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?redirect=${encodeURIComponent(
          search.redirect ?? "/profile",
        )}`,
      });
      if (error) throw error;
      setInfo("Password reset link sent. Open your email, reset the password, then sign in.");
    } catch (e: any) {
      setErr(e.message ?? "Could not send password reset link.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setErr(null);
    setInfo(null);
    setErr("Google sign in will be enabled after OAuth setup. Use email sign in or create account for now.");
  };

  return (
    <div className="min-h-dvh bg-background px-5 pb-12 pt-[calc(env(safe-area-inset-top)+48px)]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md"
      >
        <Link to="/" className="text-xs font-medium text-muted-foreground">
          ← Back
        </Link>
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight">
          {mode === "signin" ? "Welcome back" : "Create account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Sign in to manage your bookings."
            : "Join Spacio in seconds."}
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-2xl bg-muted/70 p-1">
          {(["signin", "signup"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setMode(item);
                setErr(null);
                setInfo(null);
              }}
              className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                mode === item
                  ? "bg-background text-primary shadow-[var(--shadow-soft)]"
                  : "text-muted-foreground"
              }`}
            >
              {item === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <button
          onClick={google}
          type="button"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card/70 py-3 text-sm font-semibold text-muted-foreground shadow-[var(--shadow-soft)] transition hover:bg-muted/40"
        >
          <GoogleMark /> Continue with Google after setup
        </button>

        <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <>
              <Field
                icon={<UserRound className="h-4 w-4" />}
                type="text"
                placeholder="Full name"
                value={name}
                onChange={setName}
              />
              <Field
                icon={<Phone className="h-4 w-4" />}
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={setPhone}
              />
              <div className="grid grid-cols-2 rounded-2xl bg-muted/60 p-1">
                {(["user", "host"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRole(item)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold capitalize transition ${
                      role === item
                        ? "bg-background text-primary shadow-[var(--shadow-soft)]"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </>
          )}
          <Field
            icon={<Mail className="h-4 w-4" />}
            type="email"
            placeholder="Email address"
            value={email}
            onChange={setEmail}
            required
          />
          <Field
            icon={<Lock className="h-4 w-4" />}
            type="password"
            placeholder="Password"
            value={password}
            onChange={setPassword}
            required
          />
          {err && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</p>
          )}
          {info && (
            <p className="rounded-lg bg-success/10 px-3 py-2 text-xs text-success">{info}</p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elevated)] transition disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
          {mode === "signin" && (
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={busy}
                onClick={sendEmailLink}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-semibold text-primary shadow-[var(--shadow-soft)] transition disabled:opacity-60"
              >
                Send login link
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={resetPassword}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-semibold text-primary shadow-[var(--shadow-soft)] transition disabled:opacity-60"
              >
                Reset password
              </button>
            </div>
          )}
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          {mode === "signin" ? "New to Spacio?" : "Already have an account?"}{" "}
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="font-semibold text-primary"
          >
            {mode === "signin" ? "Create account" : "Sign in"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}

function Field({
  icon,
  type,
  placeholder,
  value,
  onChange,
  required,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-soft)] focus-within:border-primary">
      <span className="text-muted-foreground">{icon}</span>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </label>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.4l-6.5-5.3C29.6 35 26.9 36 24 36c-5.3 0-9.6-3.1-11.3-8l-6.5 5C9.5 39.5 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4 5.3l6.5 5.3C41.7 35.5 44 30.2 44 24c0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}
