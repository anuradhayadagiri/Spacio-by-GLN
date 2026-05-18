import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, X, Clock } from "lucide-react";
import { HostShell } from "@/components/host/HostShell";
import { getHostBookings, updateBookingStatus } from "@/lib/host.functions";
import { useAuth } from "@/lib/auth-context";

type Tab = "pending" | "approved" | "completed";

export const Route = createFileRoute("/host/bookings")({
  head: () => ({ meta: [{ title: "Bookings — Host" }] }),
  component: HostBookingsPage,
});

function HostBookingsPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const qc = useQueryClient();
  const { session } = useAuth();
  const getBookings = useServerFn(getHostBookings);
  const updateStatus = useServerFn(updateBookingStatus);
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["host", "bookings", session?.user.id],
    queryFn: () => getBookings({ data: { accessToken: session?.access_token } }),
    enabled: Boolean(session?.access_token),
  });

  const update = useMutation({
    mutationFn: (vars: { id: string; status: "approved" | "rejected" }) =>
      updateStatus({ data: { ...vars, accessToken: session?.access_token } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["host", "bookings", session?.user.id] }),
  });

  const visible = items.filter((b) => b.status === tab);

  return (
    <HostShell title="Booking requests">
      <div className="px-5 pb-6 pt-4">
        <div className="inline-flex rounded-xl bg-muted p-1 text-xs font-medium">
          {(["pending", "approved", "completed"] as Tab[]).map((t) => (
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

        <div className="mt-4 space-y-3">
          {isLoading && (
            <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
          )}
          {visible.map((b) => {
            const listing = (b as any).listings as { title: string; image_url: string } | null;
            return (
              <div
                key={b.id}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]"
              >
                <div className="flex gap-3 p-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                    {b.guest_name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{b.guest_name}</p>
                        <p className="text-[11px] text-muted-foreground">{listing?.title}</p>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        ₹{Number(b.amount).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />{" "}
                      {new Date(b.starts_at).toLocaleString("en-IN", {
                        weekday: "short", day: "numeric", month: "short",
                        hour: "2-digit", minute: "2-digit",
                      })}{" "}
                      · {b.duration} · {b.guests} guests
                    </p>
                  </div>
                </div>
                {tab === "pending" && (
                  <div className="grid grid-cols-2 gap-px border-t border-border bg-border">
                    <button
                      disabled={update.isPending}
                      onClick={() => update.mutate({ id: b.id, status: "rejected" })}
                      className="bg-card py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-50"
                    >
                      <X className="mr-1 inline h-3.5 w-3.5" /> Decline
                    </button>
                    <button
                      disabled={update.isPending}
                      onClick={() => update.mutate({ id: b.id, status: "approved" })}
                      className="bg-card py-2.5 text-xs font-semibold text-success hover:bg-success/5 disabled:opacity-50"
                    >
                      <Check className="mr-1 inline h-3.5 w-3.5" /> Approve
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {!isLoading && visible.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              No {tab} requests right now.
            </p>
          )}
        </div>
      </div>
    </HostShell>
  );
}
