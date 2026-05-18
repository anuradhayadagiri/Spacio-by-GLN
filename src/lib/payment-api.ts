import { supabase } from "@/integrations/supabase/client";
import { confirmPaymentOrder, createPaymentOrder } from "@/lib/payment.functions";

export type PaymentMethod = "upi" | "card" | "wallet" | "split";

export type PaymentIntent = {
  id: string;
  bookingId: string;
  amount: number;
  currency: "INR";
  provider: "razorpay";
  status: "created" | "paid" | "failed";
  method?: PaymentMethod;
  mode?: "mock" | "razorpay-ready";
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getBookingCommission(bookingId: string, amount: number) {
  const fallback = { adminCommission: 0, hostPayout: amount, hostId: undefined as string | undefined };

  if (!uuidPattern.test(bookingId) || typeof window === "undefined") return fallback;

  try {
    const db = supabase as any;
    const { data: booking } = await db
      .from("bookings")
      .select("host_id, listing_id")
      .eq("id", bookingId)
      .maybeSingle();

    if (!booking) return fallback;

    const { data: listing } = await db
      .from("listings")
      .select("commission_percentage")
      .eq("id", booking.listing_id)
      .maybeSingle();

    const commissionRate = Number((listing as any)?.commission_percentage ?? 15) / 100;
    const adminCommission = Math.round(amount * commissionRate);

    return {
      adminCommission,
      hostPayout: amount - adminCommission,
      hostId: booking.host_id as string | undefined,
    };
  } catch {
    return fallback;
  }
}

export async function createPaymentIntent(input: {
  bookingId: string;
  amount: number;
  method: PaymentMethod;
}) {
  const keyAvailable = Boolean(import.meta.env.VITE_RAZORPAY_KEY_ID);
  const { data: auth } =
    typeof window !== "undefined" ? await supabase.auth.getUser() : { data: { user: null } };

  try {
    const order = await createPaymentOrder({
      data: {
        bookingId: input.bookingId,
        amount: input.amount,
        method: input.method,
        userId: auth.user?.id,
      },
    });

    return {
      id: order.id,
      bookingId: input.bookingId,
      amount: input.amount,
      currency: "INR" as const,
      provider: "razorpay" as const,
      status: "created" as const,
      mode: order.mode,
      method: input.method,
    };
  } catch {
    // Local fallback keeps checkout usable until service-role/Razorpay env is configured.
  }

  const intent: PaymentIntent = {
    id: `rzp_mock_${Date.now()}`,
    bookingId: input.bookingId,
    amount: input.amount,
    currency: "INR",
    provider: "razorpay",
    status: "created",
    mode: keyAvailable ? "razorpay-ready" : "mock",
    method: input.method,
  };

  if (typeof window !== "undefined" && uuidPattern.test(input.bookingId)) {
    const user = auth.user;
    const commission = await getBookingCommission(input.bookingId, input.amount);

    if (user) {
      await (supabase as any).from("transactions").insert({
        booking_id: input.bookingId,
        user_id: user.id,
        host_id: commission.hostId,
        amount: input.amount,
        admin_commission: commission.adminCommission,
        host_payout: commission.hostPayout,
        status: "pending",
        provider: "razorpay",
        provider_order_id: intent.id,
        method: input.method,
      } as never);
    }
  }

  return intent;
}

export async function confirmPayment(intent: PaymentIntent) {
  const paidAt = new Date().toISOString();
  const receiptId = `SPC-${intent.bookingId.slice(0, 8).toUpperCase()}`;

  try {
    await confirmPaymentOrder({
      data: {
        bookingId: intent.bookingId,
        orderId: intent.id,
        paymentId: intent.id,
      },
    });

    return {
      ...intent,
      status: "paid" as const,
      paidAt,
      receiptId,
    };
  } catch {
    // Local fallback keeps mock checkout working without server credentials.
  }

  if (typeof window !== "undefined" && uuidPattern.test(intent.bookingId)) {
    await (supabase as any)
      .from("transactions")
      .update({
        status: "paid",
        provider_payment_id: intent.id,
        razorpay_payment_id: intent.id,
        receipt_id: receiptId,
        paid_at: paidAt,
      } as never)
      .eq("booking_id", intent.bookingId)
      .eq("provider_order_id", intent.id);

    await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        payment_status: "paid",
        payment_reference: intent.id,
      } as never)
      .eq("id", intent.bookingId);
  }

  return {
    ...intent,
    status: "paid" as const,
    paidAt,
    receiptId,
  };
}
