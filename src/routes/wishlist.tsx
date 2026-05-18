import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — Spacio by GLN" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  return (
    <AppShell>
      <div className="px-5 pt-[calc(env(safe-area-inset-top)+20px)]">
        <h1 className="font-display text-2xl font-semibold">Wishlist</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Saved spaces & experiences.
        </p>
        <div className="mt-8 grid place-items-center rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          <Heart className="mb-2 h-7 w-7 text-accent" />
          Tap the heart on any listing to save it here.
        </div>
      </div>
    </AppShell>
  );
}
