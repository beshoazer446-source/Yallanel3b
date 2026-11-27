import { PLATFORM_COMMISSION_PERCENT } from "../lib/constants";
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

// ===== طلبات السحب =====
export async function getAdminWithdrawals() {
  const { data, error } = await supabase
    .from("withdrawal_requests")
    .select("*")
    .order("id", { ascending: false })
    .limit(300);
  if (error) throw error;
  const requests = data ?? [];

  const walletIds = [...new Set(requests.map((r) => r.wallet_id))];
  let wallets = new Map();
  let owners = new Map();
  if (walletIds.length) {
    const { data: walletRows, error: walletError } = await supabase
      .from("wallets")
      .select("id, owner_id")
      .in("id", walletIds);
    if (walletError) throw walletError;
    wallets = byId(walletRows);

    const ownerIds = [...new Set((walletRows ?? []).map((w) => w.owner_id))];
    if (ownerIds.length) {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, phone")
        .in("id", ownerIds);
      if (profileError) throw profileError;
      owners = byId(profiles);
    }
  }

  return requests.map((request) => {
    const wallet = wallets.get(String(request.wallet_id));
    return {
      ...request,
      owner: wallet ? owners.get(String(wallet.owner_id)) ?? null : null,
    };
  });
}

export const processWithdrawal = (id, approve) =>
  rpc("process_withdrawal", { p_request_id: id, p_approve: approve });

// ===== المعاملات المالية لكل ملعب =====
export async function getAdminTransactions() {
  const [bookingsRes, venuesRes, walletsRes, walletTxRes, withdrawalsRes] =
    await Promise.all([
      supabase
        .from("bookings")
        .select(
          "id, user_id, venue_id, date, start_time, end_time, price, deposit_amount, status, payment_method, payout_status, refund_status, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("venues").select("id, name, city, owner_id"),
      supabase
        .from("wallets")
        .select("id, owner_id, available_balance, pending_balance"),
      supabase
        .from("wallet_transactions")
        .select("id, wallet_id, type, amount, created_at, booking_id")
        .order("created_at", { ascending: false })
        .limit(300),
      supabase
        .from("withdrawal_requests")
        .select(
          "id, wallet_id, amount, status, requested_at, processed_at, payout_method, payout_details",
        )
        .order("requested_at", { ascending: false })
        .limit(200),
    ]);

  if (bookingsRes.error) throw bookingsRes.error;
  if (venuesRes.error) throw venuesRes.error;

  const bookings = bookingsRes.data ?? [];
  const venues = venuesRes.data ?? [];
  const wallets = walletsRes.data ?? [];
  const walletTransactions = walletTxRes.data ?? [];
  const withdrawals = withdrawalsRes.data ?? [];

  const userIds = [
    ...new Set([
      ...bookings.map((b) => b.user_id),
      ...venues.map((v) => v.owner_id),
    ]),
  ].filter(Boolean);

  let profilesMap = new Map();
  if (userIds.length) {
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, name, email, phone")
      .in("id", userIds);
    if (pErr) throw pErr;
    profilesMap = byId(profiles);
  }

  const venuesMap = byId(venues);
  const walletByOwner = new Map(
    wallets.map((w) => [String(w.owner_id), w]),
  );

  // ربط كل معاملة بتفاصيل الملعب والمالك والحسابات المالية
  const transactions = bookings.map((b) => {
    const venue = venuesMap.get(String(b.venue_id)) ?? null;
    const owner = venue ? profilesMap.get(String(venue.owner_id)) ?? null : null;
    const player = profilesMap.get(String(b.user_id)) ?? null;

    const totalPrice = Number(b.price ?? 0);
    const depositAmount = Number(b.deposit_amount ?? 0);
    const isConfirmed = b.status === "confirmed";
    const commission = isConfirmed
      ? Number(((totalPrice * PLATFORM_COMMISSION_PERCENT) / 100).toFixed(2))
      : 0;
    const ownerNet = isConfirmed
      ? Number((totalPrice - commission).toFixed(2))
      : 0;

    return {
      ...b,
      venue,
      owner,
      player,
      totalPrice,
      depositAmount,
      commission,
      ownerNet,
    };
  });

  // تجميع الملخص المالي لكل ملعب
  const venueSummaries = venues.map((v) => {
    const vTx = transactions.filter((t) => String(t.venue_id) === String(v.id));
    const confirmedTx = vTx.filter((t) => t.status === "confirmed");
    const pendingTx = vTx.filter((t) => t.status === "pending");
    const owner = profilesMap.get(String(v.owner_id)) ?? null;
    const wallet = walletByOwner.get(String(v.owner_id)) ?? null;

    const grossRevenue = confirmedTx.reduce((s, t) => s + t.totalPrice, 0);
    const totalDeposits = confirmedTx.reduce((s, t) => s + t.depositAmount, 0);
    const platformCommission = confirmedTx.reduce((s, t) => s + t.commission, 0);
    const ownerNetEarnings = confirmedTx.reduce((s, t) => s + t.ownerNet, 0);
    const pendingAmount = pendingTx.reduce((s, t) => s + t.totalPrice, 0);

    return {
      venue: v,
      owner,
      wallet,
      totalBookings: vTx.length,
      confirmedCount: confirmedTx.length,
      pendingCount: pendingTx.length,
      grossRevenue,
      totalDeposits,
      platformCommission,
      ownerNetEarnings,
      pendingAmount,
    };
  });

  return {
    transactions,
    venueSummaries,
    venues,
    wallets,
    walletTransactions,
    withdrawals,
  };
}