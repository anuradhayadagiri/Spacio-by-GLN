import { useMemo, useState } from "react";
import { SlidersHorizontal, ArrowUpDown, X } from "lucide-react";
import type { Listing } from "@/data/listings";

export type SortKey = "recommended" | "price-asc" | "price-desc" | "rating" | "distance";

export interface FilterState {
  sort: SortKey;
  maxPrice: number;
  minRating: number;
  instantOnly: boolean;
}

export const defaultFilters: FilterState = {
  sort: "recommended",
  maxPrice: 10000,
  minRating: 0,
  instantOnly: false,
};

export function useFilteredListings(listings: Listing[], f: FilterState) {
  return useMemo(() => {
    const filtered = listings.filter(
      (l) =>
        l.price <= f.maxPrice &&
        l.rating >= f.minRating &&
        (!f.instantOnly || l.instantBook),
    );
    const sorted = [...filtered];
    switch (f.sort) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "distance":
        sorted.sort((a, b) => a.distanceKm - b.distanceKm);
        break;
    }
    return sorted;
  }, [listings, f]);
}

export function FilterBar({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}) {
  const [open, setOpen] = useState(false);

  const sortLabel: Record<SortKey, string> = {
    recommended: "Recommended",
    "price-asc": "Price ↑",
    "price-desc": "Price ↓",
    rating: "Top rated",
    distance: "Nearest",
  };

  return (
    <>
      <div className="sticky top-0 z-30 flex gap-2 overflow-x-auto bg-background/85 px-5 py-3 backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-[var(--shadow-soft)]"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
        </button>
        {(["recommended", "distance", "price-asc", "rating"] as SortKey[]).map((k) => (
          <button
            key={k}
            onClick={() => onChange({ ...filters, sort: k })}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              filters.sort === k
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card"
            }`}
          >
            <ArrowUpDown className="mr-1 inline h-3 w-3" />
            {sortLabel[k]}
          </button>
        ))}
        <button
          onClick={() => onChange({ ...filters, instantOnly: !filters.instantOnly })}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            filters.instantOnly
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border bg-card"
          }`}
        >
          ⚡ Instant book
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="w-full rounded-t-3xl bg-background p-5 shadow-[var(--shadow-elevated)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">Filters</h3>
              <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="block text-xs font-semibold text-muted-foreground">
              Max price: ₹{filters.maxPrice.toLocaleString("en-IN")}
            </label>
            <input
              type="range"
              min={100}
              max={10000}
              step={100}
              value={filters.maxPrice}
              onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
              className="mt-2 w-full accent-primary"
            />

            <label className="mt-5 block text-xs font-semibold text-muted-foreground">
              Min rating: {filters.minRating.toFixed(1)}★
            </label>
            <input
              type="range"
              min={0}
              max={5}
              step={0.5}
              value={filters.minRating}
              onChange={(e) => onChange({ ...filters, minRating: Number(e.target.value) })}
              className="mt-2 w-full accent-primary"
            />

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => onChange(defaultFilters)}
                className="flex-1 rounded-xl border border-border py-3 text-sm font-medium"
              >
                Reset
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
