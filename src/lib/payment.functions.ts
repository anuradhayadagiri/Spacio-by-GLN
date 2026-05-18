import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { PaymentMethod } from "@/lib/payment-api";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getCommission(bookingId: string, amount: number) {
  const fallback = { adminCommission: 0, hostPayout: amount, hostId: null as string | null };

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from("bookings")
    .select("host_id, listing_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError) throw bookingError;
  if (!booking) return fallback;

  const { data: listing, error: listingError } = await supabaseAdmin
    .from("listings")
    .select("commission_percentage")
    .eq("id", (booking as any).listing_id)
    .maybeSingle();

  if (listingError) throw listingError;

  const commissionRate = Number((listing as any)?.commission_percentage ?? 15) / 100;
  const adminCommission = Math.round(amount * commissionRate);

  return {
    adminCommission,
    hostPayout: amount - adminCommission,
    hostId: (booking as any).host_id as string | null,
  };
}

export const createPaymentOrder = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { bookingId: string; amount: number; method: PaymentMethod; userId?: string }) => input,
  )
  .handler(async ({ data }) => {
    if (!uuidPattern.test(data.bookingId)) {
      return {
        id: `rzp_mock_${Date.now()}`,
        provider: "razorpay" as const,
        mode: "mock" as const,
      };
    }

    const razorpayReady = Boolean(process.env.VITE_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
    const orderId = razorpayReady ? `rzp_order_pending_${Date.now()}` : `rzp_mock_${Date.now()}`;
    const commission = await getCommission(data.bookingId, data.amount);

    if (data.userId) {
      const { error } = await (supabaseAdmin as any).from("transactions").insert({
        booking_id: data.bookingId,
        user_id: data.userId,
        host_id: commission.hostId,
        amount: data.amount,
        admin_commission: commission.adminCommission,
        host_payout: commission.hostPayout,
        status: "pending",
        provider: "razorpay",
        provider_order_id: orderId,
        method: data.method,
      } as never);
      if (error) throw error;
    }

    return {
      id: orderId,
      provider: "razorpay" as const,
      mode: razorpayReady ? ("razorpay-ready" as const) : ("mock" as const),
    };
  });

export const confirmPaymentOrder = createServerFn({ method: "POST" })
  .inputValidator((input: { bookingId: string; orderId: string; paymentId?: string }) => input)
  .handler(async ({ data }) => {
    if (!uuidPattern.test(data.bookingId)) return { ok: true };

    const paidAt = new Date().toISOString();
    const paymentId = data.paymentId ?? data.orderId;

    const { error: transactionError } = await (supabaseAdmin as any)
      .from("transactions")
      .update({
        status: "paid",
        provider_payment_id: paymentId,
        razorpay_payment_id: paymentId,
        receipt_id: `SPC-${data.bookingId.slice(0, 8).toUpperCase()}`,
        paid_at: paidAt,
      } as never)
      .eq("booking_id", data.bookingId)
      .eq("provider_order_id", data.orderId);

    if (transactionError) throw transactionError;

    const { error: bookingError } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "confirmed",
        payment_status: "paid",
        payment_reference: paymentId,
      } as never)
      .eq("id", data.bookingId);

    if (bookingError) throw bookingError;

    return { ok: true, paidAt };
  });
