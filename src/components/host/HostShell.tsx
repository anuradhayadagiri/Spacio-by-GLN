import { Link, useLocation } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard,
  ListChecks,
  CalendarRange,
  Wallet,
  Plus,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { activateHostMode } from "@/lib/host.functions";
import type { ReactNode } from "react";

type Tab = {
  to: "/host" | "/host/listings" | "/host/new" | "/host/bookings" | "/host/earnings";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  fab?: boolean;
};

const tabs: Tab[] = [
  { to: "/host", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/host/listings", label: "Listings", icon: ListChecks },
  { to: "/host/new", label: "New", icon: Plus, fab: true },
  { to: "/host/bookings", label: "Bookings", icon: CalendarRange },
  { to: "/host/earnings", label: "Earnings", icon: Wallet },
];

export function HostShell({
  title,
  children,
  rightAction,
}: {
  title: string;
  children: ReactNode;
  rightAction?: ReactNode;
}) {
  const { pathname } = useLocation();
  const { user, session, loading } = useAuth();
  const qc = useQueryClient();
  const activateHost = useServerFn(activateHostMode);
  const hostAccess = useQuery({
    queryKey: ["host", "access", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      if (!user) return false;
      const metadataRole = String(user.user_metadata?.role ?? "").toLowerCase();
      if (metadataRole === "host" || metadataRole === "admin") return true;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["host", "admin"]);
      if (roles?.length) return true;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      return ["host", "admin"].includes(String((profile as any)?.role ?? "").toLowerCase());
    },
    retry: false,
  });
  const activation = useMutation({
    mutationFn: () => activateHost({ data: { accessToken: session?.access_token } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["host", "access", user?.id] }),
  });
  const hasHostAccess = Boolean(hostAccess.data);
  const shouldGate = !loading && (!user || !hasHostAccess);

  return (
    <div className="min-h-screen bg-background">
      <div className="relative mx-auto min-h-screen w-full max-w-[480px] bg-background pb-24 shadow-[0_0_80px_-20px_rgba(0,0,0,0.15)]">
        <header
          className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/85 px-5 py-3 backdrop-blur"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
        >
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary-glow text-xs font-bold text-primary-foreground">
              S
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Host
              </p>
              <h1 className="font-display text-base font-semibold leading-none">
                {title}
              </h1>
            </div>
          </div>
          {rightAction}
        </header>
        {loading || (user && hostAccess.isLoading) ? (
          <div className="grid min-h-[55vh] place-items-center px-5 text-center text-sm text-muted-foreground">
            Checking host access...
          </div>
        ) : shouldGate ? (
          <div className="px-5 pt-5">
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel overflow-hidden rounded-3xl p-5"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <LockKeyhole className="h-6 w-6" />
              </span>
              <h2 className="mt-4 font-display text-2xl font-semibold">Host mode required</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Listing creation, commission plans, earnings, and revenue analytics are available only to verified hosts.
              </p>
              {!user ? (
                <Link
                  to="/login"
                  search={{ redirect: pathname }}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Sign in to continue
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => activation.mutate()}
                    disabled={activation.isPending}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    <Sparkles className="h-4 w-4" />
                    {activation.isPending ? "Activating..." : "Activate Host mode"}
                  </button>
                  {activation.error && (
                    <p className="mt-3 rounded-2xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      {(activation.error as Error).message}
                    </p>
                  )}
                </>
              )}
            </motion.section>
          </div>
        ) : (
          children
        )}
      </div>

      {/* host bottom nav */}
      <nav
        className="fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 border-t border-border bg-background/85 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="grid grid-cols-5 items-end">
          {tabs.map((t) => {
            const { to, label, icon: Icon, fab, exact } = t;
            const isOverview = to === "/host";
            const isActive = exact || isOverview ? pathname === to : pathname.startsWith(to);
            if (fab) {
              return (
                <li key={to} className="grid place-items-center">
                  <Link
                    to={to}
                    className="-mt-6 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-elevated)]"
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.4} />
                  </Link>
                </li>
              );
            }
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="host-nav-indicator"
                      className="absolute top-0 h-0.5 w-10 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
