import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ListingCard } from "@/components/listings/ListingCard";
import { FilterBar, defaultFilters, useFilteredListings } from "@/components/listings/FilterBar";
import { CATEGORIES, type CategorySlug } from "@/data/listings";
import { fetchLiveListings } from "@/lib/marketplace-api";
import { useState } from "react";

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => {
    const cat = CATEGORIES.find((c) => c.slug === params.slug);
    const label = cat?.label ?? "Category";
    return {
      meta: [
        { title: `${label} — Spacio by GLN` },
        { name: "description", content: `Browse ${label} listings near you on Spacio.` },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const router = useRouter();
  const cat = CATEGORIES.find((c) => c.slug === (slug as CategorySlug));
  const { data: liveListings = [], isLoading } = useQuery({
    queryKey: ["marketplace", "listings"],
    queryFn: fetchLiveListings,
  });
  const all = cat ? liveListings.filter((listing) => listing.category === cat.slug) : [];
  const [filters, setFilters] = useState(defaultFilters);
  const listings = useFilteredListings(all, filters);

  return (
    <AppShell>
      <header className="flex items-center gap-3 px-5 pt-[calc(env(safe-area-inset-top)+18px)]">
        <button
          onClick={() => router.history.back()}
          className="grid h-9 w-9 place-items-center rounded-full bg-card shadow-[var(--shadow-soft)]"
          aria-label="Back"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-display text-xl font-semibold">
            {cat?.emoji} {cat?.label ?? "Category"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {listings.length} {listings.length === 1 ? "space" : "spaces"} near you
          </p>
        </div>
      </header>

      <FilterBar filters={filters} onChange={setFilters} />

      <div className="grid grid-cols-1 gap-3 px-5 pt-2 sm:grid-cols-2">
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
            No matches. Try adjusting your filters.
            <Link to="/" className="mt-3 text-xs font-semibold text-primary">
              Browse other categories
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
