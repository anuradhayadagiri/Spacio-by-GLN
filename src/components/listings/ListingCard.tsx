import { Link } from "@tanstack/react-router";
import { Star, MapPin, Zap } from "lucide-react";
import type { Listing } from "@/data/listings";
import { motion } from "framer-motion";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-card)]"
    >
      <Link
        to="/listing/$id"
        params={{ id: listing.id }}
        className="block"
      >
        <div
          className="relative h-40 w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${listing.images[0]})` }}
        >
          {listing.instantBook && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-primary backdrop-blur">
              <Zap className="h-3 w-3 fill-current" /> Instant
            </span>
          )}
          <span className="absolute right-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur">
            {listing.categoryLabel}
          </span>
        </div>
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-sm font-semibold">{listing.title}</h3>
            <span className="flex items-center gap-0.5 text-xs font-semibold">
              <Star className="h-3 w-3 fill-current text-accent" /> {listing.rating}
            </span>
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" /> {listing.location} · {listing.distanceKm} km
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span>
              <span className="text-base font-semibold text-foreground">
                ₹{listing.price.toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] text-muted-foreground"> /{listing.priceUnit}</span>
            </span>
            <span className="text-[11px] text-muted-foreground">
              {listing.reviews} reviews
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
