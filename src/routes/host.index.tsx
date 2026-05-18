import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { TrendingUp, IndianRupee, CalendarCheck, Star, Bell, ArrowUpRight, QrCode } from "lucide-react";
import { HostShell } from "@/components/host/HostShell";
import { getHostListings, getHostBookings } from "@/lib/host.functions";
import { EARNINGS_BY_DAY } from "@/data/host";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/host/")({
  head: () => ({ meta: [{ title: "Host Dashboard — Spacio" }] }),
  component: HostOverview,
});

function HostOverview() {
  const { session } = useAuth();
  const getListings = useServerFn(getHostListings);
  const getBookings = useServerFn(getHostBookings);
  const { data: listings = [] } = useQuery({
    queryKey: ["host", "listings", session?.user.id],
    queryFn: () => getListings({ data: { accessToken: session?.access_token } }),
    enabled: Boolean(session?.access_token),
  });
  const { data: bookings = [] } = useQuery({
    queryKey: ["host", "bookings", session?.user.id],
    queryFn: () => getBookings({ data: { accessToken: session?.access_token } }),
    enabled: Boolean(session?.access_token),
  });

  const totalEarnings = bookings
    .filter((b) => b.status === "approved" || b.status === "completed")
    .reduce((s, b) => s + Number(b.amount), 0);
  const totalBookings = bookings.length;
  const liveListings = listings.filter((l) => l.status === "live");
  const avgRating = liveListings.length
    ? (liveListings.reduce((s, l) => s + Number(l.rating), 0) / liveListings.length).toFixed(2)
    : "—";
  const pending = bookings.filter((b) => b.status === "pending");
  const max = Math.max(...EARNINGS_BY_DAY.map((d) => d.value));

  return (
    <HostShell
      title="Welcome back, Aarav"
      rightAction={
        <button className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card">
          <Bell className="h-4 w-4" />
        </button>
      }
    >
      <div className="space-y-5 px-5 pb-6 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-to-br from-primary to-primary-glow p-5 text-primary-foreground shadow-[var(--shadow-elevated)]"
        >
          <p className="text-[11px] uppercase tracking-wider opacity-80">This month · earnings</p>
          <div className="mt-1 flex items-baseline gap-2">
            <h2 className="font-display text-3xl font-semibold">
              ₹{totalEarnings.toLocaleString("en-IN")}
            </h2>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold">
              <TrendingUp className="h-3 w-3" /> +18%
            </span>
          </div>
          <p className="mt-1 text-xs opacity-85">Payout scheduled for 15 May</p>

          <div className="mt-4 flex h-20 items-end gap-1.5">
            {EARNINGS_BY_DAY.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.value / max) * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="w-full rounded-t-md bg-white/70"
                />
                <span className="text-[9px] opacity-70">{d.day}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <Link
          to="/host/scan"
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
              <QrCode className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">Verify entry</p>
              <p className="text-[11px] text-muted-foreground">Scan QR or enter the 6-digit OTP</p>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        <div className="grid grid-cols-3 gap-3">
          <Kpi icon={<CalendarCheck />} value={totalBookings} label="Bookings" />
          <Kpi icon={<IndianRupee />} value={listings.length} label="Listings" />
          <Kpi icon={<Star />} value={avgRating} label="Avg rating" />
        </div>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Pending requests</h3>
            <Link to="/host/bookings" className="text-xs font-medium text-primary">View all</Link>
          </div>
          <div className="space-y-2">
            {pending.slice(0, 2).map((b) => (
              <div key={b.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-soft)]">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                  {b.guest_name[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{b.guest_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(b.starts_at).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · {b.duration}
                  </p>
                </div>
                <span className="text-sm font-semibold text-primary">
                  ₹{Number(b.amount).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
            {pending.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                You're all caught up.
              </p>
            )}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Your listings</h3>
            <Link to="/host/listings" className="text-xs font-medium text-primary">
              Manage <ArrowUpRight className="inline h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {liveListings.slice(0, 3).map((l) => (
              <div key={l.id} className="flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
                <div className="h-16 w-16 shrink-0 bg-cover bg-center" style={{ backgroundImage: `url(${l.image_url})` }} />
                <div className="flex-1 py-2">
                  <p className="line-clamp-1 text-sm font-semibold">{l.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {l.city} · ⭐ {Number(l.rating).toFixed(1)}
                  </p>
                </div>
                <span className="pr-3 text-sm font-semibold text-success">
                  ₹{Number(l.price).toLocaleString("en-IN")}/{l.price_unit}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </HostShell>
  );
}

function Kpi({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-soft)]">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary [&>svg]:h-3.5 [&>svg]:w-3.5">
        {icon}
      </span>
      <p className="mt-2 text-base font-semibold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
