import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  Gamepad2, BookOpen, Briefcase, PartyPopper, Ticket,
  ParkingSquare, Sparkles, BedDouble, UtensilsCrossed,
} from "lucide-react";
import type { CategorySlug } from "@/data/listings";

const categories: { slug: CategorySlug; label: string; icon: typeof Gamepad2; tint: string }[] = [
  { slug: "play", label: "Play", icon: Gamepad2, tint: "bg-accent/10 text-accent" },
  { slug: "study", label: "Study", icon: BookOpen, tint: "bg-primary/10 text-primary" },
  { slug: "pro-spaces", label: "Pro Spaces", icon: Briefcase, tint: "bg-success/10 text-success" },
  { slug: "party", label: "Party", icon: PartyPopper, tint: "bg-chart-4/15 text-chart-4" },
  { slug: "experiences", label: "Experiences", icon: Ticket, tint: "bg-accent/10 text-accent" },
  { slug: "parking", label: "Parking", icon: ParkingSquare, tint: "bg-muted text-foreground" },
  { slug: "wellness", label: "Wellness", icon: Sparkles, tint: "bg-success/10 text-success" },
  { slug: "stays", label: "Stays", icon: BedDouble, tint: "bg-primary/10 text-primary" },
  { slug: "dining", label: "Dining", icon: UtensilsCrossed, tint: "bg-accent/10 text-accent" },
];

export function CategoryGrid() {
  return (
    <section className="px-5 pt-5 md:px-8">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-base font-semibold">Explore categories</h2>
        <Link to="/explore" className="text-xs font-medium text-primary">See all</Link>
      </div>
      <div className="grid grid-cols-3 gap-3 md:grid-cols-9">
        {categories.map((c, i) => (
          <motion.div
            key={c.slug}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
          >
            <Link
              to="/category/$slug"
              params={{ slug: c.slug }}
              className="glass-panel flex h-full flex-col items-center gap-2 rounded-2xl p-3 text-center transition active:scale-[0.97] hover:shadow-[var(--shadow-card)]"
            >
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${c.tint}`}>
                <c.icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-medium">{c.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
