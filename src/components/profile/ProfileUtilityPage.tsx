import { Link } from "@tanstack/react-router";
import { ChevronLeft, type LucideIcon } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export function ProfileUtilityPage({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <main className="relative mx-auto max-w-3xl px-5 pt-[calc(env(safe-area-inset-top)+20px)] md:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 rounded-b-[3rem] bg-[var(--gradient-hero)]" />
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur"
        >
          <ChevronLeft className="h-4 w-4" />
          Profile
        </Link>
        <section className="mt-5 overflow-hidden rounded-3xl border border-white/30 bg-background/95 p-5 shadow-[var(--shadow-elevated)] backdrop-blur-2xl dark:bg-card/85 md:p-7">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
          <div className="mt-6 space-y-3">{children}</div>
        </section>
      </main>
    </AppShell>
  );
}

export function UtilityRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-muted/55 px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-right text-sm text-muted-foreground">{value}</span>
    </div>
  );
}
