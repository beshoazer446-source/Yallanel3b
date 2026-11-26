import { supabase } from "../lib/supabaseClient";

function getProofBucket() {
  return import.meta.env.VITE_SUPABASE_PAYMENT_PROOFS_BUCKET || "payment-proofs";
}

export async function getTakenSlots(venueId, date) {
  const { data, error } = await supabase.rpc("get_taken_slots", {
    p_venue_id: venueId,
    p_date: date,
  });

  if (error) throw error;
  return data ?? [];
}

export async function createBooking({ venueId, date, startTime, endTime, userId, proofFile }) {
  const extensions = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
  };
  const extension = extensions[proofFile?.type];
  if (!extension) {
    throw new Error("صيغة إثبات الدفع غير مدعومة. استخدم JPG أو PNG أو WebP أو PDF.");
  }
  if (proofFile.size > 5 * 1024 * 1024) {
    throw new Error("حجم الملف يجب ألا يتجاوز 5MB.");
  }

  const bucket = getProofBucket();
  const proofPath = `${userId}/${venueId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(proofPath, proofFile, { contentType: proofFile.type, upsert: false });

  if (uploadError) {
    if (uploadError.message.toLowerCase().includes("bucket not found")) {
      throw new Error(
        `مخزن إثباتات الدفع "${bucket}" غير موجود. أنشئه من Supabase Dashboard > Storage > New bucket، واجعله Private، ثم أعد المحاولة.`,
      );
    }
    throw uploadError;
  }

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      venue_id: venueId,
      date,
      start_time: startTime,
      end_time: endTime,
      user_id: userId,
      status: "pending",
      payment_proof_url: proofPath,
    })
    .select("*")
    .single();

  if (error) {
    const { error: cleanupError } = await supabase.storage.from(bucket).remove([proofPath]);
    if (cleanupError) {
      throw new Error(`${error.message} كما تعذر حذف ملف الإثبات المرفوع: ${cleanupError.message}`);
    }
    throw error;
  }
  return data;
}

export async function getPaymentProofUrl(proofPath) {
  if (!proofPath) return null;
  const { data, error } = await supabase
    .storage
    .from(getProofBucket())
    .createSignedUrl(proofPath, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}

export async function getUserBookings(userId) {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("start_time", { ascending: false });

  if (error) throw error;
  const bookings = data ?? [];
  const venueIds = [...new Set(bookings.map((booking) => booking.venue_id))];
  if (!venueIds.length) return bookings;

  const { data: venues, error: venuesError } = await supabase
    .from("venues")
    .select("id, name, address, maps_url")
    .in("id", venueIds);

  if (venuesError) throw venuesError;
  const venueById = new Map((venues ?? []).map((venue) => [String(venue.id), venue]));
  return bookings.map((booking) => ({
    ...booking,
    venue: venueById.get(String(booking.venue_id)),
  }));
}

// استبدل دالة getOwnerBookings الحالية في services/bookingsService.js بالدالة دي.
// باقي الدوال في الملف زي ما هي.

export async function getOwnerBookings(ownerId) {
  const { data: venues, error: venuesError } = await supabase
    .from("venues")
    .select("id, name")
    .eq("owner_id", ownerId);

  if (venuesError) throw venuesError;
  if (!venues?.length) return [];

  const venueById = new Map(venues.map((venue) => [String(venue.id), venue]));

  // أعمدة محددة فقط (بدون payment_proof_url ولا العمولة ولا payout)
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, user_id, venue_id, date, start_time, end_time, price, deposit_amount, status, " +
        "payment_method, payment_ref, created_at, " +
        "cancelled_at, cancellation_reason, refund_status, refund_amount",
    )
    .in("venue_id", venues.map((venue) => venue.id))
    .in("status", ["confirmed", "cancelled"]) // نخفي pending / rejected القديمة
    .order("date", { ascending: false })
    .order("start_time", { ascending: false });

  if (error) throw error;
  const bookings = data ?? [];

  // اسم العميل وتاريخ إنشاء حسابه فقط — بدون تليفون أو إيميل
  const userIds = [...new Set(bookings.map((booking) => booking.user_id).filter(Boolean))];
  let profileById = new Map();
  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, name, created_at")
      .in("id", userIds);
    if (profilesError) throw profilesError;
    profileById = new Map((profiles ?? []).map((p) => [String(p.id), p]));
  }

  return bookings.map((booking) => ({
    ...booking,
    venue: venueById.get(String(booking.venue_id)),
    player: profileById.get(String(booking.user_id)) || null,
  }));
}

export async function updateBookingStatus(bookingId, status) {
  const { data, error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error("تعذر تحديث الحجز. ربما تم تحديثه بالفعل.");
  }
  return data;
}


export async function cancelBooking(bookingId, userId) {
  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("user_id", userId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error("تعذر إلغاء الحجز. ربما تم تأكيده أو إلغاؤه بالفعل.");
  }
  return data;
}
