import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Demo host id used until auth is wired in Phase 5
export const DEMO_HOST_ID = "00000000-0000-0000-0000-00000000d1d1";
type HostPlan = "regular" | "standard" | "pro";
type PriceUnit = "hour" | "day" | "ticket" | "package" | "person";

const hostPlans: Record<HostPlan, number> = {
  regular: 15,
  standard: 20,
  pro: 25,
};

const missingRelationCodes = new Set(["42P01", "PGRST205", "PGRST116"]);

function isMissingRelationError(error: any) {
  return missingRelationCodes.has(error?.code) || String(error?.message ?? "").includes("Could not find the table");
}

async function getUserIdFromToken(accessToken?: string) {
  if (!accessToken) throw new Error("Sign in to continue as a host.");
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) throw new Error("Your session expired. Sign in again.");
  return {
    id: data.user.id,
    metadataRole: String(data.user.user_metadata?.role ?? "").toLowerCase(),
  };
}

async function queryHostRole(userId: string) {
  const { data: roles, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["host", "admin"]);

  if (roleError && !isMissingRelationError(roleError)) throw roleError;
  if (roles?.length) return true;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError && !isMissingRelationError(profileError)) throw profileError;
  return ["host", "admin"].includes(String((profile as any)?.role ?? "").toLowerCase());
}

async function requireHost(accessToken?: string) {
  const user = await getUserIdFromToken(accessToken);
  const metadataAllowsHost = user.metadataRole === "host" || user.metadataRole === "admin";
  const roleAllowsHost = await queryHostRole(user.id);
  if (!metadataAllowsHost && !roleAllowsHost) {
    throw new Error("Host access required. Activate Host mode before creating listings.");
  }
  return user.id;
}

export const activateHostMode = createServerFn({ method: "POST" })
  .inputValidator((input: { accessToken?: string }) => input)
  .handler(async ({ data }) => {
    const user = await getUserIdFromToken(data.accessToken);

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: user.id,
      role: "host",
      host_activated_at: new Date().toISOString(),
      account_modes: ["user", "host"],
      updated_at: new Date().toISOString(),
    } as never);
    if (profileError && !isMissingRelationError(profileError)) throw profileError;

    const { error: userRoleError } = await supabaseAdmin.from("user_roles").upsert(
      [
        { user_id: user.id, role: "user" },
        { user_id: user.id, role: "host" },
      ] as never,
      { onConflict: "user_id,role" },
    );
    if (userRoleError && !isMissingRelationError(userRoleError)) throw userRoleError;

    if (profileError || userRoleError) {
      throw new Error("Apply the Supabase migrations first, then activate Host mode.");
    }

    return { ok: true };
  });

export const getHostListings = createServerFn({ method: "GET" })
  .inputValidator((input?: { accessToken?: string }) => input ?? {})
  .handler(async ({ data: input }) => {
  const hostId = input.accessToken ? await requireHost(input.accessToken) : DEMO_HOST_ID;
  const { data: rows, error } = await supabaseAdmin
    .from("listings")
    .select("*")
    .eq("host_id", hostId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return rows ?? [];
});

export const getHostBookings = createServerFn({ method: "GET" })
  .inputValidator((input?: { accessToken?: string }) => input ?? {})
  .handler(async ({ data: input }) => {
  const hostId = input.accessToken ? await requireHost(input.accessToken) : DEMO_HOST_ID;
  const { data: rows, error } = await supabaseAdmin
    .from("bookings")
    .select("*, listings(title, image_url)")
    .eq("host_id", hostId)
    .order("starts_at", { ascending: false });
  if (error) throw error;
  return rows ?? [];
});

export const updateBookingStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string; status: "approved" | "rejected" | "completed"; accessToken?: string }) => input)
  .handler(async ({ data }) => {
    const hostId = data.accessToken ? await requireHost(data.accessToken) : DEMO_HOST_ID;
    const { error } = await supabaseAdmin
      .from("bookings")
      .update({ status: data.status })
      .eq("id", data.id)
      .eq("host_id", hostId);
    if (error) throw error;
    return { ok: true };
  });

export const createListing = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      accessToken?: string;
      title: string;
      category: string;
      city: string;
      state?: string;
      pincode?: string;
      address?: string;
      description?: string;
      amenities?: string[];
      rules?: string[];
      capacity?: number;
      price: number;
      price_unit: PriceUnit;
      instant_book: boolean;
      image_url?: string;
      media_urls?: string[];
      video_urls?: string[];
      latitude?: number;
      longitude?: number;
      approximate_area?: string;
      plan?: HostPlan;
      commission_percentage?: number;
    }) => input,
  )
  .handler(async ({ data }) => {
    const hostId = data.accessToken ? await requireHost(data.accessToken) : DEMO_HOST_ID;
    const plan = data.plan ?? "regular";
    const commission = hostPlans[plan];
    const { data: row, error } = await supabaseAdmin
      .from("listings")
      .insert({
        host_id: hostId,
        title: data.title,
        category: data.category,
        city: data.city,
        state: data.state ?? null,
        pincode: data.pincode ?? null,
        address: data.address ?? null,
        description: data.description ?? null,
        amenities: data.amenities ?? [],
        rules: data.rules ?? [],
        capacity: data.capacity ?? 1,
        price: data.price,
        price_unit: data.price_unit,
        instant_book: data.instant_book,
        image_url: data.image_url || data.media_urls?.[0] || null,
        media_urls: data.media_urls ?? [],
        video_urls: data.video_urls ?? [],
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        approximate_area: data.approximate_area ?? data.city,
        exact_location_locked: true,
        plan,
        commission_percentage: data.commission_percentage ?? commission,
        status: "live",
      } as never)
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const submitReview = createServerFn({ method: "POST" })
  .inputValidator((input: { listing_id: string; rating: number; comment?: string }) => input)
  .handler(async ({ data }) => {
    // Demo guest id until auth is wired here
    const GUEST_ID = "00000000-0000-0000-0000-00000000a11c";
    const { error } = await supabaseAdmin.from("reviews").insert({
      listing_id: data.listing_id,
      guest_id: GUEST_ID,
      rating: data.rating,
      comment: data.comment ?? null,
    });
    if (error) throw error;
    return { ok: true };
  });

export const toggleListingStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string; status: "live" | "paused"; accessToken?: string }) => input)
  .handler(async ({ data }) => {
    const hostId = data.accessToken ? await requireHost(data.accessToken) : DEMO_HOST_ID;
    const { error } = await supabaseAdmin
      .from("listings")
      .update({ status: data.status })
      .eq("id", data.id)
      .eq("host_id", hostId);
    if (error) throw error;
    return { ok: true };
  });
