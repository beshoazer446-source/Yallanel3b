import { supabase } from "../lib/supabaseClient";

const DAY = 24 * 60 * 60 * 1000;

async function fetchAll(table, columns) {
  const rows = [];
  const size = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order("id")
      .range(from, from + size - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < size) break;
    from += size;
  }
  return rows;
}

// تحميل الداتا الخام مرة واحدة، والحسابات حسب الفترة بتتم في computeOverview
export async function loadOverviewRaw() {
  const [profiles, venues, bookings, images] = await Promise.all([
    fetchAll("profiles", "id, name, role, created_at"),
    fetchAll(
      "venues",
      "id, name, owner_id, approval_status, created_at, reviewed_at",
    ),
    fetchAll(
      "bookings",
      "id, venue_id, status, created_at, cancelled_at, commission_amount, payout_status",
    ),
    fetchAll("venue_images", "id, venue_id, image_url, sort_order"),
  ]);

  const imageByVenue = {};
  for (const image of images) {
    const current = imageByVenue[image.venue_id];
    if (!current || image.sort_order < current.sort_order)
      imageByVenue[image.venue_id] = image;
  }
  return {
    profiles,
    venues,
    bookings,
    imageByVenue: Object.fromEntries(
      Object.entries(imageByVenue).map(([id, image]) => [id, image.image_url]),
    ),
  };
}

const time = (value) => (value ? new Date(value).getTime() : NaN);
const countIn = (rows, getDate, from, to) =>
  rows.filter((row) => {
    const t = time(getDate(row));
    return t >= from && t < to;
  }).length;
const sumIn = (rows, getDate, getValue, from, to) =>
  rows.reduce((total, row) => {
    const t = time(getDate(row));
    return t >= from && t < to ? total + getValue(row) : total;
  }, 0);
const pct = (current, previous) =>
  previous > 0 ? ((current - previous) / previous) * 100 : null;
const commissionOf = (booking) =>
  booking.payout_status === "refunded"
    ? 0
    : Number(booking.commission_amount) || 0;

const BUCKET_DAYS = { 30: 1, 90: 3, 180: 7, 365: 30 };

export function computeOverview(raw, days) {
  const now = Date.now();
  const start = now - days * DAY;
  const prevStart = start - days * DAY;
  const { profiles, venues, bookings, imageByVenue } = raw;

  const people = profiles.filter(
    (p) => p.role === "user" || p.role === "owner",
  );
  const approved = venues.filter((v) => v.approval_status === "approved");
  const created = (row) => row.created_at;

  const stats = {
    users: {
      total: people.length,
      change: pct(
        countIn(people, created, start, now),
        countIn(people, created, prevStart, start),
      ),
    },
    venues: {
      total: approved.length,
      change: pct(
        countIn(approved, created, start, now),
        countIn(approved, created, prevStart, start),
      ),
    },
    bookings: {
      total: bookings.length,
      change: pct(
        countIn(bookings, created, start, now),
        countIn(bookings, created, prevStart, start),
      ),
    },
    earnings: {
      total: bookings.reduce((sum, b) => sum + commissionOf(b), 0),
      change: pct(
        sumIn(bookings, created, commissionOf, start, now),
        sumIn(bookings, created, commissionOf, prevStart, start),
      ),
    },
  };

  // الرسم البياني: تجميع العمولة في فترات (يوم / 3 أيام / أسبوع / شهر حسب المدى)
  const step = BUCKET_DAYS[days] ?? 1;
  const bucketCount = Math.ceil(days / step);
  const chart = Array.from({ length: bucketCount }, (_, i) => ({
    date: new Date(start + i * step * DAY),
    value: 0,
  }));
  for (const booking of bookings) {
    const t = time(booking.created_at);
    if (!(t >= start && t < now)) continue;
    const index = Math.min(
      Math.floor((t - start) / (step * DAY)),
      bucketCount - 1,
    );
    chart[index].value += commissionOf(booking);
  }
  const chartData = chart.map((point) => ({
    label: point.date.toLocaleDateString("ar-EG", {
      day: "numeric",
      month: "short",
    }),
    value: Math.round(point.value * 100) / 100,
  }));

  // أكثر الملاعب حجزاً (حجوزات مؤكدة داخل الفترة)
  const counts = new Map();
  for (const booking of bookings) {
    const t = time(booking.created_at);
    if (booking.status !== "confirmed" || !(t >= start && t < now)) continue;
    counts.set(booking.venue_id, (counts.get(booking.venue_id) ?? 0) + 1);
  }
  const venueById = new Map(venues.map((v) => [v.id, v]));
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const topVenues = ranked.map(([venueId, count]) => ({
    id: venueId,
    name: venueById.get(venueId)?.name ?? "ملعب",
    image: imageByVenue[venueId] ?? null,
    count,
    ratio: ranked[0][1] ? (count / ranked[0][1]) * 100 : 0,
  }));

  return { stats, chartData, topVenues };
}

// ملاعب في انتظار المراجعة (approval_status فقط، مش is_active)
export function getPendingVenues(raw) {
  const names = new Map(raw.profiles.map((p) => [p.id, p.name]));
  const pending = raw.venues
    .filter((v) => v.approval_status === "pending_review")
    .sort((a, b) => time(b.created_at) - time(a.created_at));
  return {
    count: pending.length,
    items: pending.slice(0, 3).map((v) => ({
      id: v.id,
      name: v.name,
      ownerName: names.get(v.owner_id) ?? "—",
      image: raw.imageByVenue[v.id] ?? null,
      createdAt: v.created_at,
    })),
  };
}

// أحدث النشاطات من الجداول الحقيقية فقط
export function getActivities(raw) {
  const venueName = new Map(raw.venues.map((v) => [v.id, v.name]));
  const ownerName = new Map(raw.profiles.map((p) => [p.id, p.name]));
  const events = [];

  for (const b of raw.bookings) {
    if (b.created_at) {
      events.push({
        key: `b-${b.id}`,
        kind: "booking",
        at: b.created_at,
        text: `حجز جديد على ملعب ${venueName.get(b.venue_id) ?? ""}`,
      });
    }
    if (b.cancelled_at) {
      events.push({
        key: `bc-${b.id}`,
        kind: "cancel",
        at: b.cancelled_at,
        text: `تم إلغاء حجز على ملعب ${venueName.get(b.venue_id) ?? ""}`,
      });
    }
  }
  for (const v of raw.venues) {
    if (v.created_at) {
      events.push({
        key: `v-${v.id}`,
        kind: "venue",
        at: v.created_at,
        text: `تمت إضافة ملعب جديد: ${v.name} (${ownerName.get(v.owner_id) ?? "—"})`,
      });
    }
    if (v.reviewed_at && v.approval_status !== "pending_review") {
      events.push({
        key: `vr-${v.id}`,
        kind: v.approval_status === "approved" ? "approved" : "rejected",
        at: v.reviewed_at,
        text: `${v.approval_status === "approved" ? "تم اعتماد" : "تم رفض"} ملعب ${v.name}`,
      });
    }
  }
  for (const p of raw.profiles) {
    if (p.created_at && p.role !== "super_admin") {
      events.push({
        key: `p-${p.id}`,
        kind: "user",
        at: p.created_at,
        text: `${p.role === "owner" ? "انضم صاحب ملعب جديد" : "انضم لاعب جديد"}: ${p.name}`,
      });
    }
  }
  return events.sort((a, b) => time(b.at) - time(a.at)).slice(0, 8);
}
