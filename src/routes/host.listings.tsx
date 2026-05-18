import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MoreVertical, Plus, Eye, EyeOff, Pencil } from "lucide-react";
import { HostShell } from "@/components/host/HostShell";
import { getHostListings, toggleListingStatus } from "@/lib/host.functions";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/host/listings")({
  head: () => ({ meta: [{ title: "My Listings — Host" }] }),
  component: HostListingsPage,
});

type Row = Awaited<ReturnType<typeof getHostListings>>[number];

function HostListingsPage() {
  const qc = useQueryClient();
  const { session } = useAuth();
  const getListings = useServerFn(getHostListings);
  const toggleStatus = useServerFn(toggleListingStatus);
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["host", "listings", session?.user.id],
    queryFn: () => getListings({ data: { accessToken: session?.access_token } }),
    enabled: Boolean(session?.access_token),
  });

  const toggle = useMutation({
    mutationFn: (vars: { id: string; status: "live" | "paused" }) =>
      toggleStatus({ data: { ...vars, accessToken: session?.access_token } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["host", "listings", session?.user.id] }),
  });

  return (
    <HostShell
      title="Your listings"
      rightAction={
        <Link
          to="/host/new"
          className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> New
        </Link>
      }
    >
      <div className="space-y-3 px-5 pb-6 pt-4">
        {isLoading && <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>}
        {items.map((l) => (
          <Card
            key={l.id}
            listing={l}
            onToggle={() =>
              toggle.mutate({ id: l.id, status: l.status === "live" ? "paused" : "live" })
            }
          />
        ))}
        {!isLoading && items.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No listings yet. Tap “New” to create one.
          </p>
        )}
      </div>
    </HostShell>
  );
}

function Card({ listing, onToggle }: { listing: Row; onToggle: () => void }) {
  const statusTone =
    listing.status === "live"
      ? "bg-success/10 text-success"
      : "bg-muted text-muted-foreground";

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
      <div className="flex gap-3">
        <div
          className="h-28 w-28 shrink-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${listing.image_url})` }}
        />
        <div className="flex flex-1 flex-col py-3 pr-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="line-clamp-1 text-sm font-semibold">{listing.title}</p>
              <p className="text-[11px] text-muted-foreground">{listing.city}</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusTone}`}>
              {listing.status}
            </span>
          </div>

          <div className="mt-1 grid grid-cols-3 gap-2 text-[11px]">
            <Stat value={`₹${Number(listing.price).toLocaleString("en-IN")}`} label={`per ${listing.price_unit}`} />
            <Stat value={Number(listing.rating).toFixed(1)} label="rating" />
            <Stat value={listing.review_count} label="reviews" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-border bg-muted/30 px-3 py-2">
        <button className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium text-foreground hover:bg-background">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
        <button
          onClick={onToggle}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium text-foreground hover:bg-background"
        >
          {listing.status === "live" ? (
            <><EyeOff className="h-3.5 w-3.5" /> Pause</>
          ) : (
            <><Eye className="h-3.5 w-3.5" /> Make live</>
          )}
        </button>
        <button className="grid h-7 w-7 place-items-center rounded-lg hover:bg-background">
          <MoreVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-lg bg-muted/50 px-2 py-1.5">
      <p className="text-sm font-semibold leading-none">{value}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
