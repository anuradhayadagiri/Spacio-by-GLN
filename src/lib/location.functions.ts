import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getUserId(accessToken?: string) {
  if (!accessToken) throw new Error("Sign in to unlock the exact location.");
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) throw new Error("Your session expired. Sign in again.");
  return data.user.id;
}

async function logLocationAccess(input: {
  bookingId: string;
  listingId?: string;
  userId: string;
  granted: boolean;
  reason?: string;
}) {
  await (supabaseAdmin as any)
    .from("location_access_logs")
    .insert({
      booking_id: input.bookingId,
      listing_id: input.listingId ?? null,
      user_id: input.userId,
      granted: input.granted,
      reason: input.reason ?? null,
    })
    .throwOnError()
    .catch(() => undefined);
}

export const getUnlockedBookingLocation = createServerFn({ method: "POST" })
  .inputValidator((input: { bookingId: string; accessToken?: string }) => input)
  .handler(async ({ data }) => {
    if (!uuidPattern.test(data.bookingId)) {
      return { unlocked: false, reason: "Exact location unlock requires a saved booking." };
    }

    const userId = await getUserId(data.accessToken);
    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .select(
        "id, listing_id, guest_id, host_id, status, payment_status, listings(title, address, city, state, pincode, latitude, longitude, approximate_area)",
      )
      .eq("id", data.bookingId)
      .maybeSingle();

    if (error) throw error;
    if (!booking) return { unlocked: false, reason: "Booking not found." };
    if ((booking as any).guest_id !== userId) {
      await logLocationAccess({
        bookingId: data.bookingId,
        listingId: (booking as any).listing_id,
        userId,
        granted: false,
        reason: "booking_owner_mismatch",
      });
      return { unlocked: false, reason: "This booking belongs to another account." };
    }

    const paid = String((booking as any).payment_status ?? "").toLowerCase() === "paid";
    const allowedStatus = ["approved", "confirmed", "completed", "checked_in", "checked_out"].includes(
      String((booking as any).status ?? "").toLowerCase(),
    );

    if (!paid || !allowedStatus) {
      await logLocationAccess({
        bookingId: data.bookingId,
        listingId: (booking as any).listing_id,
        userId,
        granted: false,
        reason: "payment_not_confirmed",
      });
      return { unlocked: false, reason: "Exact location unlocks after successful payment." };
    }

    const listing = (booking as any).listings;
    const latitude = Number(listing?.latitude);
    const longitude = Number(listing?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      await logLocationAccess({
        bookingId: data.bookingId,
        listingId: (booking as any).listing_id,
        userId,
        granted: false,
        reason: "missing_coordinates",
      });
      return { unlocked: false, reason: "Host has not added map coordinates yet." };
    }

    await logLocationAccess({
      bookingId: data.bookingId,
      listingId: (booking as any).listing_id,
      userId,
      granted: true,
      reason: "paid_booking_validated",
    });

    const parts = [listing?.address, listing?.city, listing?.state, listing?.pincode].filter(Boolean);
    return {
      unlocked: true,
      title: listing?.title ?? "Spacio location",
      address: parts.join(", "),
      approximateArea: listing?.approximate_area ?? listing?.city ?? "Nearby area",
      latitude,
      longitude,
      navigationUrl: `https://www.openstreetmap.org/directions?to=${latitude}%2C${longitude}`,
      mapUrl: `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01}%2C${latitude - 0.01}%2C${longitude + 0.01}%2C${latitude + 0.01}&layer=mapnik&marker=${latitude}%2C${longitude}`,
    };
  });
