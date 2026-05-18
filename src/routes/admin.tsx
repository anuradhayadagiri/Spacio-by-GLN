import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { adminMetrics, complianceItems } from "@/data/platform";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Monitoring - Spacio by GLN" }] }),
  component: AdminPage,
});

const activity = [
  "Refund review opened for BK104928",
  "Pro listing boosted in Indiranagar",
  "Suspicious OTP retries blocked",
  "Host KYC approved for Asado Wood-Fire Kitchen",
];

function AdminPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-5 pt-[calc(env(safe-area-inset-top)+20px)] md:px-8">
        <div className="glass-panel-strong rounded-3xl p-5 md:p-7">
          <p className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
            <ShieldAlert className="h-4 w-4" />
            Admin command center
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold md:text-5xl">
            Monitor users, listings, payments, refunds, QR entries and fraud signals.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            This dashboard is wired as a production surface for Supabase policies, realtime
            streams, moderation queues, platform commissions, disputes, and audit logs.
          </p>
        </div>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {adminMetrics.map(({ label, value, trend, icon: Icon }) => (
            <div key={label} className="glass-panel rounded-3xl p-4">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-background/70 px-2 py-0.5 text-[10px] font-semibold text-success">
                  {trend}
                </span>
              </div>
              <p className="mt-4 text-2xl font-semibold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_380px]">
          <div className="glass-panel rounded-3xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Moderation queue</h2>
              <button className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-semibold">
                <RefreshCw className="h-3.5 w-3.5" />
                Realtime
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {activity.map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-background/55 p-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/15 text-accent">
                    {index === 2 ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  </span>
                  <p className="min-w-0 flex-1 text-sm">{item}</p>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>

          <aside className="glass-panel rounded-3xl p-4">
            <h2 className="text-sm font-semibold">Play Store and safety controls</h2>
            <div className="mt-3 space-y-2">
              {complianceItems.map(({ title, detail, icon: Icon }) => (
                <div key={title} className="rounded-2xl bg-background/55 p-3">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Icon className="h-4 w-4 text-primary" />
                    {title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail}</p>
                </div>
              ))}
            </div>
            <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground">
              <Ban className="h-4 w-4" />
              Ban / suspend workflow
            </button>
          </aside>
        </section>
      </main>
    </AppShell>
  );
}
