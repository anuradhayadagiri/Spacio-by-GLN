import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, ChevronLeft, CreditCard, Loader2, Smartphone, WalletCards } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { confirmPayment, createPaymentIntent, type PaymentMethod, type PaymentIntent } from "@/lib/payment-api";

type Search = {
  listing?: string;
  total?: number;
  date?: string;
  guests?: number;
  hours?: number;
  payment?: "full" | "split";
  otp?: string;
};

export const Route = createFileRoute("/payment/$bookingId")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    listing: s.listing as string | undefined,
    total: s.total ? Number(s.total) : undefined,
    date: s.date as string | undefined,
    guests: s.guests ? Number(s.guests) : undefined,
    hours: s.hours ? Number(s.hours) : undefined,
    payment: (s.payment as "full" | "split" | undefined) ?? "full",
    otp: s.otp as string | undefined,
  }),
  head: () => ({ meta: [{ title: "Payment - Spacio" }] }),
  component: PaymentPage,
});

const methods: { id: PaymentMethod; label: string; icon: typeof Smartphone }[] = [
  { id: "upi", label: "UPI", icon: Smartphone },
  { id: "card", label: "Cards", icon: CreditCard },
  { id: "wallet", label: "Wallet", icon: WalletCards },
  { id: "split", label: "Split", icon: WalletCards },
];

function PaymentPage() {
  const { bookingId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [method, setMethod] = useState<PaymentMethod>(search.payment === "split" ? "split" : "upi");
  const [busy, setBusy] = useState(false);
  const [intent, setIntent] = useState<(PaymentIntent & { mode?: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = search.total ?? 0;

  const pay = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await createPaymentIntent({ bookingId, amount: total, method });
      setIntent(created);
      await confirmPayment(created);
      navigate({
        to: "/booking/$bookingId",
        params: { bookingId },
        search: {
          listing: search.listing,
          total,
          date: search.date,
          guests: search.guests,
          hours: search.hours,
          payment: search.payment,
          otp: search.otp,
        } as never,
      });
    } catch (e: any) {
      setError(e.message ?? "Payment failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <main className="relative mx-auto max-w-xl px-5 pt-[calc(env(safe-area-inset-top)+20px)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 rounded-b-[3rem] bg-[var(--gradient-hero)]" />
        <Link to="/explore" className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">
          <ChevronLeft className="h-4 w-4" />
          Explore
        </Link>

        <section className="mt-5 rounded-3xl border border-white/30 bg-background/95 p-5 shadow-[var(--shadow-elevated)] backdrop-blur-2xl dark:bg-card/85">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <CreditCard className="h-6 w-6" />
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold">Complete payment</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Razorpay-ready payment step for UPI, cards, wallets, split payments, receipts, and refunds.
          </p>

          <div className="mt-5 rounded-2xl bg-muted/60 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Booking ID</span>
              <span className="font-mono font-semibold">{bookingId}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Payable amount</span>
              <span className="text-2xl font-semibold text-primary">₹{total.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {methods.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMethod(id)}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold ${
                  method === id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {intent && (
            <p className="mt-3 rounded-2xl bg-success/10 px-3 py-2 text-xs text-success">
              Payment intent created: <span className="font-mono">{intent.id}</span>
            </p>
          )}
          {error && <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}

          <button
            onClick={pay}
            disabled={busy || !total}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {busy ? "Processing..." : "Pay securely"}
          </button>
        </section>
      </main>
    </AppShell>
  );
}
