import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode,
  KeyRound,
  CheckCircle2,
  LogIn,
  LogOut,
  ScanLine,
  AlertCircle,
} from "lucide-react";
import { HostShell } from "@/components/host/HostShell";

export const Route = createFileRoute("/host/scan")({
  head: () => ({ meta: [{ title: "Verify entry — Host" }] }),
  component: ScanPage,
});

type Mode = "qr" | "otp";
type Verified = {
  bookingId: string;
  otp: string;
  state: "checked_in" | "checked_out";
  at: string;
};

const STORAGE_KEY = "spacio_entry_log";

function loadLog(): Record<string, Verified> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveLog(log: Record<string, Verified>) {
  if (typeof window !== "undefined")
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
}

function parseQR(text: string): { bookingId: string; otp: string } | null {
  const parts = text.trim().split("|");
  if (parts.length === 3 && parts[0] === "SPACIO") {
    return { bookingId: parts[1], otp: parts[2] };
  }
  return null;
}

function ScanPage() {
  const [mode, setMode] = useState<Mode>("qr");
  const [otp, setOtp] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Verified | null>(null);
  const [log, setLog] = useState<Record<string, Verified>>(() => loadLog());
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => saveLog(log), [log]);

  const verify = (id: string, code: string) => {
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError("OTP must be 6 digits.");
      return;
    }
    if (!id) {
      setError("Missing booking reference.");
      return;
    }
    const prev = log[id];
    const nextState: Verified["state"] =
      prev?.state === "checked_in" ? "checked_out" : "checked_in";
    const v: Verified = {
      bookingId: id,
      otp: code,
      state: nextState,
      at: new Date().toISOString(),
    };
    setLog({ ...log, [id]: v });
    setResult(v);
  };

  const handleManual = () => verify(bookingId.trim().toUpperCase(), otp.trim());

  const handleQrText = (text: string) => {
    const parsed = parseQR(text);
    if (!parsed) {
      setError("Unrecognised QR — expected a Spacio entry pass.");
      return;
    }
    verify(parsed.bookingId, parsed.otp);
  };

  const handleFile = async (file: File) => {
    setError(null);
    try {
      // Lightweight QR decode via canvas + jsqr would need a dep.
      // Fallback: prompt the host to type the code shown under the QR.
      const url = URL.createObjectURL(file);
      // Just preview; real camera scanning can be wired with a native scanner later.
      console.debug("QR preview", url);
      setError(
        "Image scan needs camera access. Use the OTP tab to enter the 6-digit code from the guest.",
      );
    } catch {
      setError("Could not read image.");
    }
  };

  return (
    <HostShell title="Verify entry">
      <div className="px-5 pb-10 pt-4">
        <div className="inline-flex rounded-xl bg-muted p-1 text-xs font-medium">
          {(
            [
              { id: "qr", label: "Scan QR", icon: QrCode },
              { id: "otp", label: "Enter OTP", icon: KeyRound },
            ] as { id: Mode; label: string; icon: typeof QrCode }[]
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setMode(id);
                setError(null);
                setResult(null);
              }}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 transition ${
                mode === id
                  ? "bg-background text-foreground shadow-[var(--shadow-soft)]"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {mode === "qr" ? (
            <motion.section
              key="qr"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-4 overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
            >
              <div className="relative mx-auto grid h-56 w-56 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10">
                <ScanLine className="h-20 w-20 text-primary/40" />
                <motion.div
                  initial={{ y: "-100%" }}
                  animate={{ y: "100%" }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-x-4 h-0.5 rounded bg-primary shadow-[0_0_12px_var(--primary)]"
                />
                <span className="absolute left-3 top-3 h-5 w-5 border-l-2 border-t-2 border-primary" />
                <span className="absolute right-3 top-3 h-5 w-5 border-r-2 border-t-2 border-primary" />
                <span className="absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-primary" />
                <span className="absolute bottom-3 right-3 h-5 w-5 border-b-2 border-r-2 border-primary" />
              </div>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Point the camera at the guest's pass. Or paste the QR text below.
              </p>
              <textarea
                rows={2}
                placeholder="SPACIO|BK000000|123456"
                onChange={(e) => {
                  const t = e.target.value;
                  if (t.includes("|")) handleQrText(t);
                }}
                className="mt-3 w-full resize-none rounded-xl border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex-1 rounded-xl border border-border bg-background py-2 text-xs font-semibold"
                >
                  Upload image
                </button>
                <button
                  onClick={() => setMode("otp")}
                  className="flex-1 rounded-xl bg-muted py-2 text-xs font-semibold"
                >
                  Use OTP instead
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>
            </motion.section>
          ) : (
            <motion.section
              key="otp"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
            >
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Booking ID
              </label>
              <input
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="BK000000"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono uppercase outline-none focus:border-primary"
              />
              <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                One-time code
              </label>
              <input
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-3 text-center font-mono text-2xl tracking-[0.4em] outline-none focus:border-primary"
              />
              <button
                onClick={handleManual}
                className="mt-4 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)]"
              >
                Verify
              </button>
            </motion.section>
          )}
        </AnimatePresence>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 overflow-hidden rounded-3xl border border-success/30 bg-success/10 p-5"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-success text-success-foreground">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-success">
                    {result.state === "checked_in" ? "Checked in" : "Checked out"}
                  </p>
                  <p className="text-[11px] text-success/80">
                    {result.bookingId} · OTP {result.otp}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-success/80">
                {result.state === "checked_in" ? (
                  <LogIn className="h-3.5 w-3.5" />
                ) : (
                  <LogOut className="h-3.5 w-3.5" />
                )}
                {new Date(result.at).toLocaleString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {Object.keys(log).length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recent entries
            </p>
            <div className="space-y-2">
              {Object.values(log)
                .sort((a, b) => b.at.localeCompare(a.at))
                .slice(0, 6)
                .map((v) => (
                  <div
                    key={v.bookingId + v.at}
                    className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-2.5 text-xs"
                  >
                    <div>
                      <p className="font-mono font-semibold">{v.bookingId}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(v.at).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        v.state === "checked_in"
                          ? "bg-success/15 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {v.state === "checked_in" ? "Inside" : "Left"}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </HostShell>
  );
}
