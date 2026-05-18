import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, BadgeIndianRupee, ChartNoAxesCombined, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { AnimatedHeader } from "@/components/home/AnimatedHeader";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedRail } from "@/components/home/FeaturedRail";
import { HOST_PLANS, productionCapabilities } from "@/data/platform";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Spacio by GLN - Book spaces, stays & experiences" },
      {
        name: "description",
        content:
          "Spacio by GLN unifies bookings for spaces, stays, dining, parking, wellness and experiences in one premium PWA.",
      },
      { property: "og:title", content: "Spacio by GLN" },
      { property: "og:description", content: "One app for every space booking." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <AppShell>
      <AnimatedHeader />
      <main className="mx-auto max-w-7xl">
        <CategoryGrid />
        <FeaturedRail />

        <section className="grid gap-3 px-5 pt-6 md:grid-cols-4 md:px-8">
          {productionCapabilities.map(({ title, description, icon: Icon }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              className="glass-panel rounded-2xl p-4"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
            </motion.div>
          ))}
        </section>

        <section className="px-5 pt-6 md:px-8">
          <div className="glass-panel-strong overflow-hidden rounded-3xl p-5 md:p-6">
            <div className="grid gap-5 md:grid-cols-[1.1fr_1.6fr] md:items-center">
              <div>
                <p className="inline-flex items-center gap-1 rounded-full bg-success/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-success">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Host monetization
                </p>
                <h2 className="mt-3 font-display text-2xl font-semibold">
                  List your space. Choose visibility. Earn with transparent commissions.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Hosts can publish spaces, manage availability, verify QR/OTP entries, and track
                  payouts from one dashboard.
                </p>
                <Link
                  to="/host/new"
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)]"
                >
                  Start listing <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {HOST_PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`rounded-2xl border border-white/30 bg-gradient-to-br ${plan.accent} p-4`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold">{plan.name}</h3>
                      <span className="rounded-full bg-background/70 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {plan.badge}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{plan.visibility}</p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-2xl font-semibold">{plan.commission}%</span>
                      <span className="text-xs text-muted-foreground">commission</span>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-xs text-success">
                      <BadgeIndianRupee className="h-3.5 w-3.5" />
                      ₹1,000 booking = ₹{(1000 * plan.commission) / 100} platform fee
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-6 md:px-8">
          <Link
            to="/admin"
            className="glass-panel flex items-center justify-between rounded-2xl p-4"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent">
                <ChartNoAxesCombined className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Admin monitoring console</p>
                <p className="text-xs text-muted-foreground">
                  Users, listings, payments, refunds, QR entries, commissions and fraud alerts.
                </p>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </section>
      </main>
    </AppShell>
  );
}
