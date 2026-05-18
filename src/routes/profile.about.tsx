import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { ProfileUtilityPage, UtilityRow } from "@/components/profile/ProfileUtilityPage";

export const Route = createFileRoute("/profile/about")({
  head: () => ({ meta: [{ title: "About Spacio - Spacio by GLN" }] }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <ProfileUtilityPage
      title="About Spacio"
      description="Spacio by GLN is a space super-app for bookings, payments, QR/OTP access, reviews and host monetization."
      icon={FileText}
    >
      <UtilityRow label="App version" value="v0.2 production slice" />
      <UtilityRow label="Support" value="supportspacio@gmail.com" />
      <Link to="/legal/$slug" params={{ slug: "privacy" }} className="block rounded-2xl bg-muted/55 px-4 py-3 text-sm font-medium">
        Privacy Policy
      </Link>
      <Link to="/legal/$slug" params={{ slug: "terms" }} className="block rounded-2xl bg-muted/55 px-4 py-3 text-sm font-medium">
        Terms & Conditions
      </Link>
      <Link to="/legal/$slug" params={{ slug: "refunds" }} className="block rounded-2xl bg-muted/55 px-4 py-3 text-sm font-medium">
        Refund Policy
      </Link>
    </ProfileUtilityPage>
  );
}
