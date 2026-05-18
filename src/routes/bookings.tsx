import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, MapPin, QrCode } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { LISTINGS } from "@/data/listings";
import { fetchMyBookings, type BookingRow } from "@/lib/marketplace-api";
import { useAuth } from "@/lib/auth-context";

type Tab = "upcoming" | "past" | "cancelled";

const sample = [
  {
    id: "BK104928",
    listingId: "l1",
    date: "Sat, 9 May / 4:00 PM",
    status: "upcoming" as Tab,
  },
  {
    id: "BK098713",
    listingId: "l5",
    date: "Fri, 1 May / 8:30 PM",
    status: "past" as Tab,
  },
];

export const Route = createFileRoute("/bookings")({
  head: () => ({ meta: [{ title: "My Bookings - Spacio by GLN" }] }),
  component: BookingsPage,
});

function bookingTab(status: BookingRow["status"], startsAt: string): Tab {
  if (status === "cancelled" || status === "rejected") return "cancelled";
  if (status === "completed" || status === "checked_out" || new Date(startsAt) < new Date()) return "past";
  return "upcoming";
}

function BookingsPage() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const { user } = useAuth();
  const { data: dbBookings = [], isLoading } = useQuery({
    queryKey: ["me", "bookings", user?.id],
    queryFn: fetchMyBookings,
    enabled: Boolean(user),
  });

  const liveItems = useMemo(
    () => dbBookings.filter((booking) => bookingTab(booking.status, booking.starts_at) === tab),
    [dbBookings, tab],
  );
  const demoItems = !user ? sample.filter((item) => item.status === tab) : [];

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-5 pt-[calc(env(safe-area-inset-top)+20px)] md:px-8">
        <h1 className="font-display text-2xl font-semibold">My Bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user ? "Synced from Supabase." : "Sign in to sync bookings across devices."}
        </p>
        <div className="mt-4 inline-flex rounded-xl bg-muted p-1 text-xs font-medium">
          {(["upcoming", "past", "cancelled"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 capitalize transition ${
                tab === t
                  ? "bg-background text-foreground shadow-[var(--shadow-soft)]"
                  : "text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {isLoading && (
            <div className="col-span-full rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              Loading bookings...
            </div>
          )}

          {liveItems.map((booking) => (
            <BookingCard key={booking.id} booking={booking} tab={tab} />
          ))}

          {demoItems.map((booking) => {
            const listing = LISTINGS.find((item) => item.id === booking.listingId);
            if (!listing) return null;
            return (
              <Link
                key={booking.id}
                to="/booking/$bookingId"
                params={{ bookingId: booking.id }}
                search={{ listing: listing.id, total: listing.price, date: booking.date } as never}
                className="flex gap-3 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] transition active:scale-[0.99]"
              >
                <div
                  className="h-24 w-24 shrink-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${listing.images[0]})` }}
                />
                <div className="flex flex-1 flex-col py-2.5 pr-3">
                  <p className="line-clamp-1 text-sm font-semibold">{listing.title}</p>
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {listing.location}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{booking.date}</p>
                  <BookingFooter id={booking.id} tab={tab} />
                </div>
              </Link>
            );
          })}

          {!isLoading && liveItems.length === 0 && demoItems.length === 0 && (
            <div className="col-span-full grid place-items-center rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              <CalendarCheck className="mb-2 h-7 w-7 text-primary" />
              No {tab} bookings yet.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function BookingCard({ booking, tab }: { booking: BookingRow; tab: Tab }) {
  const date = new Date(booking.starts_at).toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const listing = booking.listings;

  return (
    <Link
      to="/booking/$bookingId"
      params={{ bookingId: booking.id }}
      search={{
        listing: booking.listing_id,
        total: booking.amount,
        date,
        guests: booking.guests,
        otp: booking.otp ?? undefined,
      } as never}
      className="flex gap-3 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] transition active:scale-[0.99]"
    >
      <div
        className="h-24 w-24 shrink-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${listing?.image_url || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&q=70&auto=format&fit=crop"})`,
        }}
      />
      <div className="flex flex-1 flex-col py-2.5 pr-3">
        <p className="line-clamp-1 text-sm font-semibold">{listing?.title ?? "Spacio booking"}</p>
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3" /> {listing?.city ?? "Location"}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{date}</p>
        <BookingFooter id={booking.id} tab={tab} />
      </div>
    </Link>
  );
}

function BookingFooter({ id, tab }: { id: string; tab: Tab }) {
  return (
    <div className="mt-auto flex items-center justify-between">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">#{id}</span>
      {tab === "upcoming" && (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
          <QrCode className="h-3 w-3" /> View QR
        </span>
      )}
    </div>
  );
}
