import { supabase } from "@/integrations/supabase/client";
import {
  CATEGORIES,
  LISTINGS,
  type BookingType,
  type CategorySlug,
  type Listing,
} from "@/data/listings";

type ListingRow = {
  id: string;
  host_id: string;
  title: string;
  category: string;
  city: string;
  approximate_area?: string | null;
  description: string | null;
  price: number;
  price_unit: "hour" | "day" | "ticket" | "package" | "person";
  rating: number;
  review_count: number;
  image_url: string | null;
  instant_book: boolean;
  status: string;
};

export type BookingRow = {
  id: string;
  listing_id: string;
  host_id: string;
  guest_id: string;
  guest_name: string;
  starts_at: string;
  duration: string | null;
  guests: number;
  amount: number;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled" | "checked_in" | "checked_out";
  qr_code: string | null;
  otp: string | null;
  listings?: {
    title: string;
    city: string;
    image_url: string | null;
  } | null;
};

const categoryLabel = (slug: string) =>
  CATEGORIES.find((category) => category.slug === slug)?.label ??
  slug
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");

const bookingTypeFromUnit = (unit: ListingRow["price_unit"]): BookingType => {
  if (unit === "day") return "daily";
  if (unit === "ticket") return "ticket";
  if (unit === "package" || unit === "person") return "package";
  return "hourly";
};

export function mapListingRow(row: ListingRow): Listing {
  const location = row.approximate_area || row.city;
  return {
    id: row.id,
    title: row.title,
    category: row.category as CategorySlug,
    categoryLabel: categoryLabel(row.category),
    location,
    approximateLocation: location,
    distanceKm: 2.4,
    rating: Number(row.rating) || 0,
    reviews: row.review_count ?? 0,
    price: Number(row.price) || 0,
    priceUnit: row.price_unit,
    bookingType: bookingTypeFromUnit(row.price_unit),
    instantBook: row.instant_book,
    amenities: ["Verified host", "QR/OTP access", "Secure payment"],
    host: { name: "Spacio Host", rating: 4.8, superhost: true },
    images: [
      row.image_url ||
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=70&auto=format&fit=crop",
    ],
    description: row.description || "A verified Spacio listing with secure booking and access.",
    hostId: row.host_id,
  };
}

const publicListingColumns = [
  "id",
  "host_id",
  "title",
  "category",
  "city",
  "approximate_area",
  "description",
  "price",
  "price_unit",
  "rating",
  "review_count",
  "image_url",
  "instant_book",
  "status",
].join(",");

export async function fetchLiveListings() {
  if (typeof window === "undefined") return LISTINGS;

  try {
    const { data, error } = await supabase
      .from("listings")
      .select(publicListingColumns)
      .eq("status", "live")
      .order("created_at", { ascending: false });

    if (error) throw error;
    const listings = ((data ?? []) as unknown as ListingRow[]).map(mapListingRow);
    return listings.length ? listings : LISTINGS;
  } catch (error) {
    console.warn("[Spacio] Falling back to local listings", error);
    return LISTINGS;
  }
}

export async function fetchListingById(id: string) {
  const local = LISTINGS.find((listing) => listing.id === id);
  if (typeof window === "undefined") return local;

  try {
    const { data, error } = await supabase.from("listings").select(publicListingColumns).eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? mapListingRow(data as unknown as ListingRow) : local;
  } catch (error) {
    console.warn("[Spacio] Falling back to local listing", error);
    return local;
  }
}

export async function fetchMyBookings() {
  if (typeof window === "undefined") return [];

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return [];

    const { data, error } = await supabase
      .from("bookings")
      .select("*, listings(title, city, image_url)")
      .eq("guest_id", user.id)
      .order("starts_at", { ascending: true });

    if (error) throw error;
    return (data ?? []) as BookingRow[];
  } catch (error) {
    console.warn("[Spacio] Could not load bookings", error);
    return [];
  }
}

export async function createCustomerBooking(input: {
  listing: Listing;
  date: string;
  hours: number;
  guests: number;
  total: number;
}) {
  if (typeof window === "undefined") {
    return {
      id: `BK${Date.now().toString().slice(-6)}`,
      otp: Math.floor(100000 + Math.random() * 900000).toString(),
      persisted: false,
    };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const bookingId = `BK${Date.now().toString().slice(-6)}`;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!user || !input.listing.hostId || !isUuid.test(input.listing.id)) {
    return { id: bookingId, otp, persisted: false };
  }

  const startsAt = new Date(`${input.date}T10:00:00`).toISOString();
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      listing_id: input.listing.id,
      host_id: input.listing.hostId,
      guest_id: user.id,
      guest_name:
        (user.user_metadata?.full_name as string | undefined) ||
        user.email?.split("@")[0] ||
        "Guest",
      starts_at: startsAt,
      duration: input.listing.bookingType === "hourly" ? `${input.hours} hr` : input.listing.bookingType,
      guests: input.guests,
      amount: input.total,
      status: input.listing.instantBook ? "approved" : "pending",
      otp,
      qr_code: `SPACIO|${bookingId}|${otp}`,
    })
    .select("id, otp")
    .single();

  if (error) throw error;
  await supabase
    .from("bookings")
    .update({ qr_code: `SPACIO|${data.id}|${data.otp ?? otp}` })
    .eq("id", data.id);
  return { id: data.id, otp: data.otp ?? otp, persisted: true };
}
