import { supabase } from "../lib/supabaseClient";

async function rpc(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data;
}

function byId(rows) {
  return new Map((rows ?? []).map((row) => [String(row.id), row]));
}

// ===== المستخدمون =====
export async function getAdminUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, phone, role, is_active, created_at")
    .in("role", ["user", "owner"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export const updateUserProfile = (id, name, phone) =>
  rpc("admin_update_user_profile", {
    p_user_id: id,
    p_name: name,
    p_phone: phone,
  });
export const suspendUser = (id) => rpc("admin_suspend_user", { p_user_id: id });
export const reactivateUser = (id) =>
  rpc("admin_reactivate_user", { p_user_id: id });

// ===== الملاعب =====
export async function getAdminVenues() {
  const { data, error } = await supabase
    .from("venues")
    .select(
      "id, name, city, area, owner_id, approval_status, is_active, is_admin_suspended, rejection_reason, suspension_reason, created_at",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  const venues = data ?? [];

  const ownerIds = [...new Set(venues.map((v) => v.owner_id))];
  let owners = new Map();
  if (ownerIds.length) {
    const { data: profiles, error: pError } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", ownerIds);
    if (pError) throw pError;
    owners = byId(profiles);
  }
  return venues.map((v) => ({
    ...v,
    owner: owners.get(String(v.owner_id)) ?? null,
  }));
}

export const approveVenue = (id) =>
  rpc("admin_approve_venue", { p_venue_id: id });
export const rejectVenue = (id, reason) =>
  rpc("admin_reject_venue", { p_venue_id: id, p_reason: reason });
export const suspendVenue = (id, reason) =>
  rpc("admin_suspend_venue", { p_venue_id: id, p_reason: reason });
export const unsuspendVenue = (id) =>
  rpc("admin_unsuspend_venue", { p_venue_id: id });

// ===== الحجوزات =====
export async function getAdminBookings() {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, user_id, venue_id, date, start_time, end_time, price, deposit_amount, status, payment_method, payout_status, cancelled_at, cancellation_reason, refund_status",
    )
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  const bookings = data ?? [];

  const venueIds = [...new Set(bookings.map((b) => b.venue_id))];
  const userIds = [...new Set(bookings.map((b) => b.user_id))];
  const [venuesRes, usersRes] = await Promise.all([
    venueIds.length
      ? supabase.from("venues").select("id, name").in("id", venueIds)
      : { data: [] },
    userIds.length
      ? supabase.from("profiles").select("id, name").in("id", userIds)
      : { data: [] },
  ]);
  if (venuesRes.error) throw venuesRes.error;
  if (usersRes.error) throw usersRes.error;
  const venues = byId(venuesRes.data);
  const users = byId(usersRes.data);

  return bookings.map((b) => ({
    ...b,
    venue: venues.get(String(b.venue_id)) ?? null,
    player: users.get(String(b.user_id)) ?? null,
  }));
}

export const cancelBookingAsAdmin = (id, reason) =>
  rpc("admin_cancel_booking", {
    p_booking_id: id,
    p_reason: reason,
    p_request_refund: false,
  });
export async function getAdminVenueDetails(venueId) {
  const [venueRes, imagesRes, hoursRes, methodsRes] = await Promise.all([
    supabase.from("venues").select("*").eq("id", venueId).single(),
    supabase
      .from("venue_images")
      .select("id, image_url, sort_order")
      .eq("venue_id", venueId)
      .order("sort_order"),
    supabase
      .from("venue_working_hours")
      .select("day_of_week, open_time, close_time")
      .eq("venue_id", venueId)
      .order("day_of_week")
      .order("open_time"),
    supabase
      .from("venue_payment_methods")
      .select("method, account")
      .eq("venue_id", venueId),
  ]);
  for (const result of [venueRes, imagesRes, hoursRes, methodsRes]) {
    if (result.error) throw result.error;
  }

  const venue = venueRes.data;
  const { data: owner, error: ownerError } = await supabase
    .from("profiles")
    .select("id, name, email, phone, is_active")
    .eq("id", venue.owner_id)
    .maybeSingle();
  if (ownerError) throw ownerError;

  return {
    venue,
    owner,
    images: imagesRes.data ?? [],
    hours: hoursRes.data ?? [],
    methods: methodsRes.data ?? [],
  };
}