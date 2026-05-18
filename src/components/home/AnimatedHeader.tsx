import { Link } from "@tanstack/react-router";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { MapPin, Mic, Search, ShieldCheck, Sparkles } from "lucide-react";

export function AnimatedHeader() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const pull = useMotionValue(0);
  const elasticPull = useSpring(pull, { stiffness: 180, damping: 18 });

  const headerHeight = useTransform(scrollY, [0, 120], [238, 124]);
  const brandScale = useTransform(scrollY, [0, 120], [1, 0.84]);
  const taglineOpacity = useTransform(scrollY, [0, 70], [1, 0]);
  const pullGlow = useTransform(elasticPull, [0, 92], [0.28, 0.9]);

  return (
    <motion.header
      ref={ref}
      drag="y"
      dragConstraints={{ top: 0, bottom: 96 }}
      dragElastic={0.45}
      onDrag={(_, info) => pull.set(Math.max(0, Math.min(96, info.offset.y)))}
      onDragEnd={() => pull.set(0)}
      style={{ height: headerHeight, background: "var(--gradient-hero)" }}
      className="sticky top-0 z-40 overflow-hidden rounded-b-[2rem] text-primary-foreground shadow-[var(--shadow-elevated)]"
    >
      <motion.div
        aria-hidden
        style={{ opacity: pullGlow }}
        className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.58),transparent_58%)]"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.16),transparent_42%,rgba(255,255,255,0.1))]" />

      <div className="relative mx-auto flex h-full max-w-7xl flex-col px-5 pt-[calc(env(safe-area-inset-top)+14px)] md:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="glass-panel flex min-w-0 items-center gap-2 rounded-full px-3 py-2 text-sm/none">
            <MapPin className="h-4 w-4 shrink-0" />
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="text-[10px] uppercase tracking-wider opacity-70">Location</span>
              <span className="truncate font-medium">Bengaluru, Koramangala</span>
            </div>
          </div>
          <motion.div whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.03 }}>
            <Link
              to="/host"
              className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black shadow-lg transition-all hover:bg-white/90"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Host
            </Link>
          </motion.div>
        </div>

        <motion.div style={{ scale: brandScale, transformOrigin: "left center" }} className="mt-5">
          <h1 className="font-display text-3xl font-semibold tracking-normal md:text-5xl">
            Spacio <span className="font-light opacity-80">by GLN</span>
          </h1>
          <motion.p style={{ opacity: taglineOpacity }} className="mt-1 max-w-xl text-sm opacity-85">
            Discover, book, pay, and unlock premium spaces with QR and OTP access.
          </motion.p>
          <motion.p
            style={{ y: elasticPull, opacity: pullGlow }}
            className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/90"
          >
            Pull to reveal Spacio by GLN
          </motion.p>
        </motion.div>

        <div className="mt-auto pb-4">
          <div className="glass-panel-strong flex items-center gap-3 rounded-2xl px-4 py-3 text-foreground">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search spaces, stays, dining..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.08 }}
              type="button"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-success text-white shadow-lg"
              aria-label="Voice Search"
            >
              <Mic className="h-4 w-4" />
            </motion.button>
            <span className="hidden items-center gap-1 rounded-lg bg-success/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-success sm:inline-flex">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
