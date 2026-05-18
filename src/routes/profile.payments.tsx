import { createFileRoute } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";
import { ProfileUtilityPage, UtilityRow } from "@/components/profile/ProfileUtilityPage";

export const Route = createFileRoute("/profile/payments")({
  head: () => ({ meta: [{ title: "Payment History - Spacio" }] }),
  component: PaymentsPage,
});

function PaymentsPage() {
  return (
    <ProfileUtilityPage
      title="Payment history"
      description="Receipts, refunds, split payments and Razorpay transaction references will appear here."
      icon={CreditCard}
    >
      <UtilityRow label="Last payment" value="₹2,362 / Booking BK104928" />
      <UtilityRow label="Refund status" value="No active refunds" />
      <UtilityRow label="Saved methods" value="UPI, cards and wallets via Razorpay" />
    </ProfileUtilityPage>
  );
}
