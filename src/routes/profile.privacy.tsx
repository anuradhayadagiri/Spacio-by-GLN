import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { ProfileUtilityPage, UtilityRow } from "@/components/profile/ProfileUtilityPage";

export const Route = createFileRoute("/profile/privacy")({
  head: () => ({ meta: [{ title: "Privacy Settings - Spacio" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <ProfileUtilityPage
      title="Privacy settings"
      description="Manage device trust, login alerts, location use, camera permission disclosures and account safety."
      icon={ShieldCheck}
    >
      <UtilityRow label="Device tracking" value="Trusted device model ready" />
      <UtilityRow label="Location use" value="Nearby discovery and directions" />
      <UtilityRow label="Camera use" value="QR scanning only" />
      <UtilityRow label="Suspicious login alerts" value="Enabled" />
    </ProfileUtilityPage>
  );
}
