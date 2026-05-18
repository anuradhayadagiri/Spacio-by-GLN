import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Calendar, MapPin, Copy, Star, Navigation, LockKeyhole } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/layout/AppShell";
import { getListing } from "@/data/listings";
import { submitReview } from "@/lib/host.functions";
import { getUnlockedBookingLocation } from "@/lib/location.functions";
import { useAuth } from "@/lib/auth-context";
import { MapLibreLocation } from "@/components/maps/MapLibreLocation";

type Search = {
  listing?: string;
  total?: number;
  date?: string;
  guests?: number;
  hours?: number;
  payment?: "full" | "split";
  otp?: string;
};

export const Route = createFileRoute("/booking/$bookingId")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    listing: s.listing as string | undefined,
    total: s.total ? Number(s.total) : undefined,
    date: s.date as string | undefined,
    guests: s.guests ? Number(s.guests) : undefined,
    hours: s.hours ? Number(s.hours) : undefined,
    payment: (s.payment as "full" | "split" | undefined) ?? "full",
    otp: s.otp as string | undefined,
  }),
  head: () => ({ meta: [{ title: "Booking confirmed — Spacio" }] }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { bookingId } = Route.useParams();
  const search = Route.useSearch();
  const { session } = useAuth();
  const unlockLocation = useServerFn(getUnlockedBookingLocation);
  const listing = search.listing ? getListing(search.listing) : undefined;
  const locationQuery = useQuery({
    queryKey: ["booking", "location", bookingId, session?.user.id],
    queryFn: () => unlockLocation({ data: { bookingId, accessToken: session?.access_token } }),
    enabled: Boolean(session?.access_token),
    retry: false,
  });
  const otp =
    search.otp ??
    (parseInt(bookingId.replace(/\D/g, "") || "0", 10) % 900000 + 100000)
      .toString()
      .slice(0, 6);
  // Use external QR service for placeholder QR
  const qrPayload = encodeURIComponent(`SPACIO|${bookingId}|${otp}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${qrPayload}&margin=10`;

  return (
    <AppShell>
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+24px)]">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 14 }}
          className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success"
        >
          <CheckCircle2 className="h-9 w-9" />
        </motion.div>
        <h1 className="mt-4 text-center font-display text-xl font-semibold">
          Booking confirmed
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          A receipt has been sent to your registered email.
        </p>

        <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="bg-gradient-to-br from-primary to-primary-glow p-5 text-primary-foreground">
            <p className="text-[10px] uppercase tracking-wider opacity-80">
              {listing?.categoryLabel ?? "Booking"}
            </p>
            <h2 className="font-display text-lg font-semibold">
              {listing?.title ?? "Your booking"}
            </h2>
            <p className="mt-1 flex items-center gap-1 text-xs opacity-90">
              <MapPin className="h-3 w-3" /> {listing?.location ?? "—"}
            </p>
          </div>

          <div className="grid place-items-center bg-card p-5">
            <img
              src={qrUrl}
              alt="Entry QR"
              className="h-44 w-44 rounded-xl border border-border bg-white p-2"
            />
            <p className="mt-3 text-[11px] text-muted-foreground">
              Show this QR at entry
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted px-4 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                OTP
              </span>
              <span className="font-mono text-lg font-bold tracking-[0.3em]">{otp}</span>
              <button
                onClick={() => navigator.clipboard?.writeText(otp)}
                className="ml-1 rounded-md p-1 hover:bg-background"
                aria-label="Copy OTP"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px bg-border text-sm">
            <Cell label="Booking ID" value={bookingId} />
            <Cell label="Date" value={search.date ?? "—"} />
            <Cell label={search.hours ? "Duration" : "Guests"} value={
              search.hours ? `${search.hours} hr` : `${search.guests ?? 1}`
            } />
            <Cell
              label="Total"
              value={search.total ? `₹${search.total.toLocaleString("en-IN")}` : "—"}
              highlight
            />
          </div>
          <div className="bg-card px-4 py-3 text-[11px] text-muted-foreground">
            Payment mode:{" "}
            <span className="font-medium text-foreground">
              {search.payment === "split" ? "Split between guests" : "Paid in full"}
            </span>
          </div>
        </div>

        <LocationAccessPanel
          loading={locationQuery.isLoading}
          location={locationQuery.data}
          fallbackArea={listing?.approximateLocation ?? listing?.location}
        />

        {listing && <ReviewBlock listingId={listing.id} />}

        <div className="mt-6 flex gap-3">
          <Link
            to="/bookings"
            className="flex-1 rounded-2xl border border-border bg-card py-3 text-center text-sm font-semibold"
          >
            <Calendar className="mr-1 inline h-4 w-4" /> My bookings
          </Link>
          <Link
            to="/"
            className="flex-1 rounded-2xl bg-primary py-3 text-center text-sm font-semibold text-primary-foreground"
          >
            Done
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function LocationAccessPanel({
  loading,
  location,
  fallbackArea,
}: {
  loading: boolean;
  location:
    | Awaited<ReturnType<typeof getUnlockedBookingLocation>>
    | undefined;
  fallbackArea?: string;
}) {
  if (loading) {
    return (
      <div className="mt-6 rounded-3xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Validating secure location access...
      </div>
    );
  }

  if (!location?.unlocked) {
    return (
      <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="relative grid h-36 place-items-center overflow-hidden bg-[linear-gradient(135deg,rgba(226,232,240,0.9),rgba(219,234,254,0.75))] dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9))]">
          <div className="absolute inset-0 blur-sm [background-image:linear-gradient(rgba(100,116,139,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.25)_1px,transparent_1px)] [background-size:28px_28px]" />
          <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-background/80 text-primary shadow-[var(--shadow-card)] backdrop-blur">
            <LockKeyhole className="h-6 w-6" />
          </span>
        </div>
        <div className="p-4">
          <p className="text-sm font-semibold">Exact location locked</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {location?.reason ?? "Live map and navigation are available only after paid booking validation."}
          </p>
          {fallbackArea && (
            <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <MapPin className="h-3.5 w-3.5" /> {fallbackArea}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-success/30 bg-card shadow-[var(--shadow-card)]">
      <MapLibreLocation
        latitude={location.latitude}
        longitude={location.longitude}
        label={location.title}
        interactive
      />
      <div className="p-4">
        <p className="text-sm font-semibold text-success">Exact location unlocked</p>
        <p className="mt-1 text-sm">{location.address}</p>
        <a
          href={location.navigationUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
        >
          <Navigation className="h-4 w-4" /> Open navigation
        </a>
      </div>
    </div>
  );
}

function ReviewBlock({ listingId }: { listingId: string }) {
  const reviewFn = useServerFn(submitReview);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const m = useMutation({
    mutationFn: () =>
      reviewFn({ data: { listing_id: listingId, rating, comment } }),
  });

  if (m.isSuccess) {
    return (
      <div className="mt-6 rounded-2xl border border-success/30 bg-success/10 p-4 text-center text-sm text-success">
        Thanks for your review!
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-4">
      <p className="text-sm font-semibold">Rate your experience</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Help future guests by sharing your visit.
      </p>
      <div className="mt-3 flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} aria-label={`${n} star`}>
            <Star
              className={`h-7 w-7 transition ${
                n <= rating ? "fill-accent text-accent" : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Optional note (what stood out?)"
        className="mt-3 w-full resize-none rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
      />
      <button
        disabled={!rating || m.isPending}
        onClick={() => m.mutate()}
        className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {m.isPending ? "Submitting…" : "Submit review"}
      </button>
    </div>
  );
}


function Cell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-card p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${highlight ? "text-primary" : ""}`}>
        {value}
      </p>
    </div>
  );
}
