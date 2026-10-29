import { supabase } from "../lib/supabaseClient";
import { PLATFORM_COMMISSION_PERCENT } from "../lib/constants";

export async function getVenues() {
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function searchVenues(searchTerm) {
  const venues = await getVenues();
  const term = searchTerm.trim().toLocaleLowerCase();
  if (!term) return venues;

  return venues.filter((venue) =>
    [venue.name, venue.address, venue.area, venue.city]
      .filter(Boolean)
      .some((value) => value.toLocaleLowerCase().includes(term)),
  );
}

export async function getVenueById(venueId) {
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("id", venueId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getVenueBookingInfo(venueId) {
  const [hoursResult, methodsResult] = await Promise.all([
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

  if (hoursResult.error) throw hoursResult.error;
  if (methodsResult.error) throw methodsResult.error;

  return {
    workingHours: hoursResult.data ?? [],
    paymentMethods: methodsResult.data ?? [],
  };
}

export async function getOwnerVenues(ownerId) {
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("owner_id", ownerId)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function getOwnerVenueById(venueId, ownerId) {
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("id", venueId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function saveVenue({ venueId, ownerId, venue, workingHours, paymentMethods }) {
  const query = venueId
    ? supabase.from("venues").update(venue).eq("id", venueId).eq("owner_id", ownerId)
    : supabase.from("venues").insert({ ...venue, owner_id: ownerId });
  const { data, error } = await query.select("*").single();

  if (error) throw error;
  if (!data) throw new Error("لم يتم حفظ بيانات الملعب.");

  const { data: oldHours, error: loadHoursError } = await supabase
    .from("venue_working_hours")
    .select("id")
    .eq("venue_id", data.id);
  if (loadHoursError) {
    throw new Error(`تم حفظ بيانات الملعب لكن تعذر قراءة مواعيد العمل القديمة: ${loadHoursError.message}`);
  }

  const hoursToSave = workingHours
    .filter((hours) => hours.open_time && hours.close_time)
    .map((hours) => ({
      venue_id: data.id,
      day_of_week: hours.day_of_week,
      open_time: hours.open_time,
      close_time: hours.close_time,
    }));

  if (hoursToSave.length) {
    const { error: insertHoursError } = await supabase
      .from("venue_working_hours")
      .insert(hoursToSave);
    if (insertHoursError) {
      throw new Error(`تم حفظ بيانات الملعب لكن تعذر حفظ مواعيد العمل: ${insertHoursError.message}`);
    }
  }

  const oldHourIds = (oldHours ?? []).map((hours) => hours.id);
  if (oldHourIds.length) {
    const { error: deleteHoursError } = await supabase
      .from("venue_working_hours")
      .delete()
      .eq("venue_id", data.id)
      .in("id", oldHourIds);
    if (deleteHoursError) {
      throw new Error(`تم حفظ مواعيد جديدة لكن تعذر حذف المواعيد القديمة: ${deleteHoursError.message}`);
    }
  }

  const { data: oldMethods, error: loadMethodsError } = await supabase
    .from("venue_payment_methods")
    .select("id")
    .eq("venue_id", data.id);
  if (loadMethodsError) {
    throw new Error(`تم حفظ الملعب لكن تعذر قراءة طرق الدفع القديمة: ${loadMethodsError.message}`);
  }

  const methodsToSave = paymentMethods
    .filter((method) => method.method && method.account.trim())
    .map((method) => ({
      venue_id: data.id,
      method: method.method,
      account: method.account.trim(),
    }));

  if (methodsToSave.length) {
    const { error: insertMethodsError } = await supabase
      .from("venue_payment_methods")
      .insert(methodsToSave);
    if (insertMethodsError) {
      throw new Error(`تم حفظ الملعب لكن تعذر حفظ طرق الدفع: ${insertMethodsError.message}`);
    }
  }

  const oldMethodIds = (oldMethods ?? []).map((method) => method.id);
  if (oldMethodIds.length) {
    const { error: deleteMethodsError } = await supabase
      .from("venue_payment_methods")
      .delete()
      .eq("venue_id", data.id)
      .in("id", oldMethodIds);
    if (deleteMethodsError) {
      throw new Error(`تم حفظ طرق دفع جديدة لكن تعذر حذف القديمة: ${deleteMethodsError.message}`);
    }
  }

  return data;
}

export async function getAdminOverview() {
  const [profilesResult, venuesResult] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("venues").select("id", { count: "exact", head: true }),
  ]);
  const failedResult = [profilesResult, venuesResult].find((result) => result.error);
  if (failedResult) throw failedResult.error;

  let bookingCount = 0;
  let platformCommission = 0;
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("bookings")
      .select("price, status")
      .range(from, from + pageSize - 1);
    if (error) throw error;

    bookingCount += data.length;
    platformCommission += data
      .filter((booking) => booking.status === "confirmed" && Number.isFinite(Number(booking.price)))
      .reduce(
        (total, booking) => total + (Number(booking.price) * PLATFORM_COMMISSION_PERCENT) / 100,
        0,
      );
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return {
    profiles: profilesResult.count ?? 0,
    venues: venuesResult.count ?? 0,
    bookings: bookingCount,
    platformCommission,
  };
}
