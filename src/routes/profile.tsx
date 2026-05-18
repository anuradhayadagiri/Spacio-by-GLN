import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  ChevronRight,
  HelpCircle,
  Home,
  LogIn,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth-context";
import { useTheme, type ThemePreference } from "@/lib/theme-context";
import { profileSections } from "@/data/platform";
import { fetchMyProfile, updateThemePreference } from "@/lib/profile-api";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile - Spacio by GLN" }] }),
  component: ProfilePage,
});

const themeOptions: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const sectionRoutes: Record<string, { to: string; params?: { slug: string } }> = {
  "Booking history": { to: "/bookings" },
  Wishlist: { to: "/wishlist" },
  "Payment history": { to: "/profile/payments" },
  "Notification settings": { to: "/profile/notifications" },
  "Privacy settings": { to: "/profile/privacy" },
  "About Spacio": { to: "/profile/about" },
};

function ProfilePage() {
  const { user, signOut, loading } = useAuth();
  const { preference, setPreference } = useTheme();
  const navigate = useNavigate();
  const { data: profile } = useQuery({
    queryKey: ["me", "profile", user?.id],
    queryFn: fetchMyProfile,
    enabled: Boolean(user),
  });
  const themeMutation = useMutation({ mutationFn: updateThemePreference });
  const name =
    profile?.full_name ||
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Guest";

  return (
    <AppShell>
      <main className="relative mx-auto max-w-5xl px-5 pt-[calc(env(safe-area-inset-top)+20px)] md:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 rounded-b-[3rem] bg-[var(--gradient-hero)] opacity-95" />
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border border-white/30 bg-background/95 shadow-[var(--shadow-elevated)] backdrop-blur-2xl dark:bg-card/80"
        >
          <div className="bg-[linear-gradient(135deg,rgba(30,64,175,0.98),rgba(37,99,235,0.92)_52%,rgba(249,115,22,0.92))] p-5 text-white md:p-7">
            <div className="flex flex-wrap items-center gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-3xl bg-white/20 text-2xl font-semibold uppercase text-white shadow-lg ring-1 ring-white/30">
                {name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-xl font-semibold text-white">
                  {name}
                  <BadgeCheck className="h-5 w-5 text-emerald-200" />
                </p>
                <p className="mt-1 truncate text-sm text-white/90">
                  {user ? user.email : "Sign in to manage bookings, payments and preferences"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                  <span className="rounded-full bg-white/18 px-3 py-1 text-white">
                    {profile?.role ?? "User"} account
                  </span>
                  <span className="rounded-full bg-white/18 px-3 py-1 text-white">
                    Joined{" "}
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString("en-IN", {
                          month: "short",
                          year: "numeric",
                        })
                      : "May 2026"}
                  </span>
                  <span className="rounded-full bg-white/18 px-3 py-1 text-white">PWA ready</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/25"
                >
                  <Home className="h-4 w-4" /> Home
                </Link>
                {user ? (
                  <button
                    onClick={async () => {
                      await signOut();
                      navigate({ to: "/" });
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/25"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                ) : (
                  <Link
                    to="/login"
                    search={{ redirect: "/profile" }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-primary"
                  >
                    <LogIn className="h-4 w-4" /> Sign in / Sign up
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-3">
            <Stat label="Bookings" value="12" />
            <Stat label="Saved" value="28" />
            <Stat label="Reward score" value="4.8" />
          </div>
        </motion.section>

        <section className="mt-5 grid gap-4 md:grid-cols-[1fr_340px]">
          <div className="space-y-3">
            <div className="glass-panel rounded-3xl p-4">
              <h2 className="text-sm font-semibold">Verification</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <VerifiedRow
                  icon={<Mail />}
                  label="Email verified"
                  value={profile?.email_verified ? user?.email ?? "Verified" : user?.email ?? "Add email"}
                />
                <VerifiedRow
                  icon={<Phone />}
                  label="Phone verified"
                  value={profile?.phone_verified ? profile?.phone ?? "+91 verified" : "Add phone"}
                />
                <VerifiedRow icon={<ShieldCheck />} label="Device trust" value="Current device trusted" />
                <VerifiedRow icon={<UserRound />} label="Role" value="User / Host eligible" />
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl">
              {profileSections.map(({ label, detail, icon: Icon }) => (
                <ProfileOption
                  key={label}
                  label={label}
                  detail={detail}
                  icon={<Icon className="h-4 w-4" />}
                  route={sectionRoutes[label]}
                />
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="glass-panel rounded-3xl p-4">
              <h2 className="text-sm font-semibold">Theme</h2>
              <div className="mt-3 grid grid-cols-3 rounded-2xl bg-muted/60 p-1">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setPreference(option.value);
                      themeMutation.mutate(option.value);
                    }}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      preference === option.value
                        ? "bg-background text-primary shadow-[var(--shadow-soft)]"
                        : "text-muted-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Theme preference persists locally and can be mirrored to Supabase profiles.
              </p>
            </div>

            <div className="glass-panel rounded-3xl p-4">
              <h2 className="text-sm font-semibold">About Spacio</h2>
              <div className="mt-3 space-y-2 text-sm">
                <InfoLink label="Privacy Policy" to="/legal/$slug" slug="privacy" />
                <InfoLink label="Terms & Conditions" to="/legal/$slug" slug="terms" />
                <InfoLink label="Refund Policy" to="/legal/$slug" slug="refunds" />
                <InfoLink label="Community Guidelines" to="/legal/$slug" slug="community" />
              </div>
              <a
                href="mailto:supportspacio@gmail.com"
                className="mt-4 flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
              >
                <HelpCircle className="h-4 w-4" />
                Contact support
              </a>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                {loading ? "" : "Spacio by GLN v0.2 production slice"}
              </p>
            </div>
          </aside>
        </section>
      </main>
    </AppShell>
  );
}

function ProfileOption({
  label,
  detail,
  icon,
  route,
}: {
  label: string;
  detail: string;
  icon: React.ReactNode;
  route?: { to: string; params?: { slug: string } };
}) {
  const content = (
    <>
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block truncate text-xs text-muted-foreground">{detail}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </>
  );

  const className =
    "flex w-full items-center gap-3 border-b border-border/60 px-4 py-3.5 text-left last:border-b-0 hover:bg-muted/40";

  if (!route) {
    return <div className={className}>{content}</div>;
  }

  if (route.params) {
    return (
      <Link to={route.to as never} params={route.params as never} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <Link to={route.to as never} className={className}>
      {content}
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-background/55 p-3">
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function VerifiedRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-background/55 p-3">
      <span className="text-success [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold">{label}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{value}</span>
      </span>
    </div>
  );
}

function InfoLink({
  label,
  to,
  slug,
}: {
  label: string;
  to: "/legal/$slug";
  slug: string;
}) {
  return (
    <Link to={to} params={{ slug }} className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
      <span>{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
