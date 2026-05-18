import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDownToLine, TrendingUp } from "lucide-react";
import { HostShell } from "@/components/host/HostShell";
import { EARNINGS_BY_DAY } from "@/data/host";
import { getHostBookings } from "@/lib/host.functions";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/host/earnings")({
  head: () => ({ meta: [{ title: "Earnings — Host" }] }),
  component: EarningsPage,
});

function EarningsPage() {
  const { session } = useAuth();
  const getBookings = useServerFn(getHostBookings);
  const { data: bookings = [] } = useQuery({
    queryKey: ["host", "bookings", session?.user.id],
    queryFn: () => getBookings({ data: { accessToken: session?.access_token } }),
    enabled: Boolean(session?.access_token),
  });
  const total = bookings
    .filter((b) => b.status === "approved" || b.status === "completed")
    .reduce((s, b) => s + Number(b.amount), 0);
  const fees = Math.round(total * 0.12);
  const net = total - fees;
  const max = Math.max(...EARNINGS_BY_DAY.map((d) => d.value));

  const transactions = bookings
    .filter((b) => b.status === "approved" || b.status === "completed")
    .slice(0, 5)
    .map((b) => ({
      id: b.id.slice(0, 6).toUpperCase(),
      date: new Date(b.starts_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      listing: ((b as any).listings?.title as string) ?? "Listing",
      amount: Number(b.amount),
    }));

  return (
    <HostShell title="Earnings">
      <div className="space-y-5 px-5 pb-6 pt-4">
        <div className="rounded-3xl bg-gradient-to-br from-primary to-primary-glow p-5 text-primary-foreground shadow-[var(--shadow-elevated)]">
          <p className="text-[11px] uppercase tracking-wider opacity-80">
            Net payout · this month
          </p>
          <h2 className="mt-1 font-display text-3xl font-semibold">
            ₹{net.toLocaleString("en-IN")}
          </h2>
          <p className="mt-1 text-xs opacity-85">
            ₹{fees.toLocaleString("en-IN")} platform fee · payout 15 May
          </p>
          <button className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-primary">
            <ArrowDownToLine className="h-3.5 w-3.5" /> Withdraw
          </button>
        </div>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">This week</h3>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
              <TrendingUp className="h-3 w-3" /> +24%
            </span>
          </div>
          <div className="mt-4 flex h-28 items-end gap-1.5">
            {EARNINGS_BY_DAY.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.value / max) * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary-glow"
                />
                <span className="text-[10px] text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold">Recent transactions</h3>
          <div className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{t.listing}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {t.date} · #{t.id}
                  </p>
                </div>
                <span className="text-sm font-semibold text-success">
                  +₹{t.amount.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </HostShell>
  );
}
