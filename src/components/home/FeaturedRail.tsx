import { Star, MapPin, Zap } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { LISTINGS } from "@/data/listings";

export function FeaturedRail() {
  const featured = LISTINGS.slice(0, 5);
  return (
    <section className="pt-6">
      <div className="mb-3 flex items-end justify-between px-5 md:px-8">
        <h2 className="text-base font-semibold">Featured nearby</h2>
        <Link to="/explore" className="text-xs font-medium text-primary">
          View all
        </Link>
      </div>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 md:grid md:grid-cols-5 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {featured.map((item) => (
          <Link
            key={item.id}
            to="/listing/$id"
            params={{ id: item.id }}
            className="glass-panel w-[230px] shrink-0 snap-start overflow-hidden rounded-2xl transition active:scale-[0.98] md:w-auto"
          >
            <div
              className="relative h-32 w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${item.images[0]})` }}
            >
              {item.instantBook && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-primary backdrop-blur">
                  <Zap className="h-3 w-3 fill-current" /> Instant
                </span>
              )}
            </div>
            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-1 text-sm font-semibold">{item.title}</h3>
                <span className="flex items-center gap-0.5 rounded-md bg-success/10 px-1.5 py-0.5 text-[11px] font-semibold text-success">
                  <Star className="h-3 w-3 fill-current" /> {item.rating}
                </span>
              </div>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3" /> {item.categoryLabel} · {item.location}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-primary">
                  ₹{item.price.toLocaleString("en-IN")}
                  <span className="text-[10px] font-normal text-muted-foreground">
                    /{item.priceUnit}
                  </span>
                </span>
                <span className="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
                  Book
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
