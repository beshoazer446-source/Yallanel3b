import { supabase } from "../lib/supabaseClient";
import { addDays, toDateKey } from "../lib/dateUtils";
import { getOwnerVenues } from "./venuesService";

const PAGE_SIZE = 1000;
const PROFILES_CHUNK = 100;

// بنجيب من أول الشهر اللي فات (أو آخر 30 يوم لو أبعد) لحد أي تاريخ في المستقبل
function getFetchStartKey(today) {
  const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const thirtyDaysAgo = addDays(today, -29);
  return toDateKey(prevMonthStart < thirtyDaysAgo ? prevMonthStart : thirtyDaysAgo);
}

async function fetchBookings(venueIds, fromKey) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, user_id, venue_id, date, start_time, end_time, price, status",
      )
      .in("venue_id", venueIds)
      .gte("date", fromKey)
      .or("status.eq.confirmed,payout_status.not.is.null")
      .order("date")
      .order("start_time")
      .order("id")
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

// أسماء اللاعبين. لو مفيش صلاحية قراءة profiles بنكمل من غير أسماء.
async function fetchPlayers(userIds) {
  const players = new Map();
  for (let i = 0; i < userIds.length; i += PROFILES_CHUNK) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", userIds.slice(i, i + PROFILES_CHUNK));
      if (error) continue;
      for (const profile of data ?? []) players.set(String(profile.id), profile);
    } catch {
      // مش هنعطل الصفحة بسبب الأسماء
    }
  }
  return players;
}

export async function getOwnerOverviewData(ownerId, today = new Date()) {
  const venues = await getOwnerVenues(ownerId);
  if (!venues.length) {
    return { venues, workingHours: [], paymentMethods: [], bookings: [] };
  }

  const venueIds = venues.map((venue) => venue.id);
  const [hoursResult, methodsResult, rawBookings] = await Promise.all([
    supabase
      .from("venue_working_hours")
      .select("venue_id, day_of_week, open_time, close_time")
      .in("venue_id", venueIds),
    supabase.from("venue_payment_methods").select("venue_id").in("venue_id", venueIds),
    fetchBookings(venueIds, getFetchStartKey(today)),
  ]);

  if (hoursResult.error) throw hoursResult.error;
  if (methodsResult.error) throw methodsResult.error;

  const userIds = [...new Set(rawBookings.map((b) => b.user_id).filter(Boolean))];
  const players = await fetchPlayers(userIds);
  const venueById = new Map(venues.map((venue) => [String(venue.id), venue]));

  const bookings = rawBookings.map((booking) => ({
    ...booking,
    venue: venueById.get(String(booking.venue_id)) ?? null,
    player: players.get(String(booking.user_id)) ?? null,
  }));

  return {
    venues,
    workingHours: hoursResult.data ?? [],
    paymentMethods: methodsResult.data ?? [],
    bookings,
  };
}
