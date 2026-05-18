import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  Bell,
  Camera,
  ChartNoAxesCombined,
  Clock3,
  CreditCard,
  FileText,
  Gauge,
  KeyRound,
  MapPinned,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

export type HostPlanId = "regular" | "standard" | "pro";

export type HostPlan = {
  id: HostPlanId;
  name: string;
  badge: string;
  visibility: string;
  commission: number;
  features: string[];
  accent: string;
};

export const HOST_PLANS: HostPlan[] = [
  {
    id: "regular",
    name: "Regular",
    badge: "Starter",
    visibility: "Home page visibility",
    commission: 15,
    features: ["Basic placement", "Standard support", "QR/OTP entry"],
    accent: "from-primary/20 to-primary/5",
  },
  {
    id: "standard",
    name: "Standard",
    badge: "Best value",
    visibility: "Explore page featured",
    commission: 20,
    features: ["Better ranking", "Search boosts", "Recommendation lift"],
    accent: "from-accent/25 to-primary/10",
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Most recommended",
    visibility: "Featured across app",
    commission: 25,
    features: ["Premium placements", "Priority support", "Advanced analytics"],
    accent: "from-success/25 to-primary/10",
  },
];

export const productionCapabilities: {
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Secure payments",
    description: "Razorpay-ready UPI, cards, wallets, refunds, receipts, and split payments.",
    icon: CreditCard,
  },
  {
    title: "QR and OTP access",
    description: "Encrypted digital pass, expiry validation, and host-side entry logs.",
    icon: QrCode,
  },
  {
    title: "Realtime operations",
    description: "Supabase Realtime hooks for bookings, availability, chat, and alerts.",
    icon: Bell,
  },
  {
    title: "Play Store ready",
    description: "PWA install shell, permission disclosures, legal pages, and Capacitor path.",
    icon: Smartphone,
  },
];

export const profileSections = [
  { label: "Booking history", detail: "Upcoming, past and cancelled visits", icon: Clock3 },
  { label: "Wishlist", detail: "Saved spaces and experiences", icon: Sparkles },
  { label: "Payment history", detail: "Receipts, refunds and split payments", icon: WalletCards },
  { label: "Notification settings", detail: "Bookings, payments, offers and host alerts", icon: Bell },
  { label: "Privacy settings", detail: "Device trust, login alerts and data controls", icon: ShieldCheck },
  { label: "About Spacio", detail: "Legal, support and app version", icon: FileText },
];

export const adminMetrics = [
  { label: "Active users", value: "24.8K", trend: "+18%", icon: Users },
  { label: "Live listings", value: "3,912", trend: "+9%", icon: MapPinned },
  { label: "GMV today", value: "₹18.4L", trend: "+22%", icon: Banknote },
  { label: "Fraud alerts", value: "17", trend: "Needs review", icon: AlertTriangle },
  { label: "QR entries", value: "8,421", trend: "Live", icon: KeyRound },
  { label: "Commission", value: "₹3.2L", trend: "Blended 21%", icon: ChartNoAxesCombined },
];

export const complianceItems = [
  { title: "Camera permission", detail: "Used only for host QR scanning and guest access validation.", icon: Camera },
  { title: "Location permission", detail: "Used for nearby discovery, directions, and distance sorting.", icon: MapPinned },
  { title: "Payment security", detail: "HTTPS-only APIs, Razorpay tokenization, and transaction audit logs.", icon: ShieldCheck },
  { title: "Performance", detail: "Lazy routes, optimized imagery, offline shell, and realtime cache updates.", icon: Gauge },
  { title: "Verified marketplace", detail: "Host KYC, content moderation, verified booking reviews, and reports.", icon: BadgeCheck },
];
