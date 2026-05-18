import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Heart, Share2, Star, MapPin, Zap, BadgeCheck, Wifi, LockKeyhole } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { getListing } from "@/data/listings";
import { BookingSheet } from "@/components/booking/BookingSheet";
import { fetchListingById } from "@/lib/marketplace-api";

export const Route = createFileRoute("/listing/$id")({
  head: ({ params }) => {
    const local = getListing(params.id);
    return {
      meta: [
        { title: local ? `${local.title} - Spacio by GLN` : "Listing - Spacio" },
        { name: "description", content: local?.description ?? "Book on Spacio." },
        { property: "og:image", content: local?.images[0] ?? "" },
      ],
    };
  },
  component: ListingPage,
});

function ListingPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const [imgIdx, setImgIdx] = useState(0);
  const [saved, setSaved] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const { data: listing, isLoading } = useQuery({
    queryKey: ["marketplace", "listing", id],
    queryFn: () => fetchListingById(id),
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="grid min-h-[60vh] place-items-center p-8 text-center text-sm text-muted-foreground">
          Loading listing...
        </div>
      </AppShell>
    );
  }

  if (!listing) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <p className="text-sm">Listing not found.</p>
          <Link to="/" className="mt-3 inline-block text-sm text-primary">
            Back home
          </Link>
        </div>
      </AppShell>
    );
  }

  const image = listing.images[imgIdx] ?? listing.images[0];

  return (
    <AppShell>
      <div className="relative">
        <div className="h-72 w-full bg-cover bg-center md:h-[420px]" style={{ backgroundImage: `url(${image})` }} />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+14px)] md:px-8">
          <button
            onClick={() => router.history.back()}
            className="grid h-9 w-9 place-items-center rounded-full bg-background/90 shadow backdrop-blur"
            aria-label="Back"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex gap-2">
            <button className="grid h-9 w-9 place-items-center rounded-full bg-background/90 shadow backdrop-blur">
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSaved((s) => !s)}
              className="grid h-9 w-9 place-items-center rounded-full bg-background/90 shadow backdrop-blur"
              aria-label="Save"
            >
              <Heart className={`h-4 w-4 ${saved ? "fill-accent text-accent" : ""}`} />
            </button>
          </div>
        </div>
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
          {listing.images.map((_, i) => (
            <button
              key={i}
              onClick={() => setImgIdx(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === imgIdx ? "w-6 bg-white" : "w-1.5 bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 pt-5 md:grid-cols-[1fr_380px] md:px-8">
        <div>
          <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            {listing.categoryLabel}
          </span>
          <h1 className="mt-2 font-display text-2xl font-semibold leading-tight md:text-4xl">
            {listing.title}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {listing.location} / {listing.distanceKm} km away
          </div>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 font-semibold">
              <Star className="h-4 w-4 fill-accent text-accent" /> {listing.rating}
            </span>
            <span className="text-muted-foreground">/ {listing.reviews} reviews</span>
            {listing.instantBook && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
                <Zap className="h-3 w-3 fill-current" /> Instant book
              </span>
            )}
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-sm font-semibold text-primary-foreground">
              {listing.host.name[0]}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Hosted by {listing.host.name}</p>
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Star className="h-3 w-3 fill-accent text-accent" /> {listing.host.rating} host rating
                {listing.host.superhost && (
                  <span className="ml-1 inline-flex items-center gap-0.5 rounded bg-success/10 px-1.5 py-0.5 font-semibold text-success">
                    <BadgeCheck className="h-3 w-3" /> Superhost
                  </span>
                )}
              </p>
            </div>
          </div>

          <section className="mt-5">
            <h2 className="text-sm font-semibold">About this space</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {listing.description}
            </p>
          </section>

          <section className="mt-5">
            <h2 className="text-sm font-semibold">What's included</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {listing.amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs"
                >
                  <Wifi className="h-3 w-3 text-primary" /> {amenity}
                </span>
              ))}
            </div>
          </section>

          <section className="mb-6 mt-5 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
            <div className="relative grid h-44 place-items-center overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(30,64,175,0.18),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.18),transparent_28%),linear-gradient(135deg,rgba(248,250,252,0.9),rgba(226,232,240,0.8))] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.16),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9))]">
              <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(100,116,139,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.25)_1px,transparent_1px)] [background-size:28px_28px]" />
              <div className="relative rounded-3xl border border-white/50 bg-background/75 px-5 py-4 text-center shadow-[var(--shadow-card)] backdrop-blur-xl">
                <LockKeyhole className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-2 text-sm font-semibold">Approximate location</p>
                <p className="mt-1 text-xs text-muted-foreground">{listing.approximateLocation ?? listing.location}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-4 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Exact address, live map, route guidance, and navigation unlock only after successful payment.
            </div>
          </section>
        </div>

        <aside className="glass-panel sticky top-20 hidden h-fit rounded-3xl p-4 md:block">
          <p className="text-2xl font-semibold">
            ₹{listing.price.toLocaleString("en-IN")}
            <span className="ml-1 text-xs font-normal text-muted-foreground">/{listing.priceUnit}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {listing.instantBook ? "Confirms instantly" : "Host approval required"}
          </p>
          <button
            onClick={() => setBookOpen(true)}
            className="mt-4 w-full rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)]"
          >
            {listing.bookingType === "ticket" ? "Get tickets" : "Book now"}
          </button>
        </aside>
      </div>

      <div
        className="fixed bottom-0 left-1/2 z-40 w-full max-w-[520px] -translate-x-1/2 border-t border-border bg-background/95 px-5 py-3 backdrop-blur md:hidden"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">
              ₹{listing.price.toLocaleString("en-IN")}
              <span className="ml-1 text-xs font-normal text-muted-foreground">/{listing.priceUnit}</span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              {listing.instantBook ? "Confirms instantly" : "Host approval required"}
            </p>
          </div>
          <button
            onClick={() => setBookOpen(true)}
            className="rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)]"
          >
            {listing.bookingType === "ticket" ? "Get tickets" : "Book now"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {bookOpen && <BookingSheet listing={listing} onClose={() => setBookOpen(false)} />}
      </AnimatePresence>
    </AppShell>
  );
}
