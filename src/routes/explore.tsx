import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LocateFixed, Map, Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ListingCard } from "@/components/listings/ListingCard";
import { FilterBar, defaultFilters, useFilteredListings } from "@/components/listings/FilterBar";
import { CATEGORIES } from "@/data/listings";
import { fetchLiveListings } from "@/lib/marketplace-api";

export const Route = createFileRoute("/explore")({
  head: () => ({ meta: [{ title: "Explore - Spacio by GLN" }] }),
  component: ExplorePage,
});

function ExplorePage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(defaultFilters);
  const { data: sourceListings = [], isLoading } = useQuery({
    queryKey: ["marketplace", "listings"],
    queryFn: fetchLiveListings,
  });

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sourceListings;
    return sourceListings.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q) ||
        l.categoryLabel.toLowerCase().includes(q) ||
        l.amenities.some((amenity) => amenity.toLowerCase().includes(q)),
    );
  }, [query, sourceListings]);

  const listings = useFilteredListings(searched, filters);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-5 pt-[calc(env(safe-area-inset-top)+20px)] md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold md:text-4xl">Explore</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Search nearby stays, workspaces, dining, events, parking and wellness.
            </p>
          </div>
          <button className="glass-panel inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-semibold text-primary">
            <LocateFixed className="h-4 w-4" />
            Use live location
          </button>
        </div>

        <div className="glass-panel-strong mt-4 flex items-center gap-2 rounded-2xl px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            placeholder="Search spaces, location, category..."
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className="glass-panel shrink-0 rounded-full px-3 py-1.5 text-xs font-medium"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      <div className="mx-auto grid max-w-7xl gap-4 px-5 pt-2 md:grid-cols-[1fr_360px] md:px-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {isLoading && (
            <div className="col-span-full rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              Loading live listings...
            </div>
          )}
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
          {listings.length === 0 && (
            <div className="col-span-full grid place-items-center rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              No results. Try a different search.
            </div>
          )}
        </div>
        <aside className="glass-panel sticky top-20 hidden h-[520px] rounded-3xl p-4 md:block">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Map preview</h2>
            <Map className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-4 grid h-[420px] place-items-center rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.22),transparent_28%),radial-gradient(circle_at_70%_70%,rgba(249,115,22,0.2),transparent_26%),linear-gradient(135deg,rgba(30,64,175,0.16),rgba(255,255,255,0.16))] px-6 text-center text-xs text-muted-foreground">
            Mapbox or Google Maps layer hooks in here for nearby discovery and directions.
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
