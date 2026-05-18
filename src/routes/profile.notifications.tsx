import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { ProfileUtilityPage, UtilityRow } from "@/components/profile/ProfileUtilityPage";

export const Route = createFileRoute("/profile/notifications")({
  head: () => ({ meta: [{ title: "Notification Settings - Spacio" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <ProfileUtilityPage
      title="Notification settings"
      description="Control booking confirmations, payment alerts, refunds, promotions, messages and host updates."
      icon={Bell}
    >
      <UtilityRow label="Booking alerts" value="Enabled" />
      <UtilityRow label="Payment alerts" value="Enabled" />
      <UtilityRow label="Promotions" value="Optional" />
      <UtilityRow label="Push notifications" value="Ready for PWA permission flow" />
    </ProfileUtilityPage>
  );
}
