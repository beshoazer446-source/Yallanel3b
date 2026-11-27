import { addDays, parseDateKey, toDateKey } from "../../../lib/dateUtils";
import { formatTime, toMinutes } from "../court-form/workingHours";

// دوال حساب بحتة (من غير React ولا شبكة) عشان تتجرب بسهولة

export const WEEKDAYS = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

const LIVE_STATUSES = new Set(["pending", "confirmed"]);

function pad(value) {
  return String(value).padStart(2, "0");
}

function byDateTime(a, b) {
  return (
    String(a.date).localeCompare(String(b.date)) ||
    String(a.start_time).localeCompare(String(b.start_time))
  );
}

function timeMinutes(value) {
  return toMinutes(String(value ?? "").slice(0, 5));
}

// مدة الحجز بالدقائق (لو النهاية قبل البداية يبقى عدّى منتصف الليل)
function bookingMinutes(booking) {
  const start = timeMinutes(booking.start_time);
  let end = timeMinutes(booking.end_time);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  if (end <= start) end += 1440;
  return end - start;
}

function sumGross(list) {
  return list.reduce((total, booking) => total + (Number(booking.price) || 0), 0);
}
const netOf = (booking) =>
  (Number(booking.price) || 0) - (Number(booking.commission_amount) || 0);

function sumNet(list) {
  return list.reduce((total, booking) => total + netOf(booking), 0);
}

// ---------- تنسيق ----------

export function formatMoney(value) {
  return Math.round(Number(value) || 0).toLocaleString("en-US");
}

export function formatClock(date) {
  return formatTime(`${pad(date.getHours())}:${pad(date.getMinutes())}`);
}

export function formatTimeRange(start, end) {
  return `${formatTime(String(start).slice(0, 5))} – ${formatTime(String(end).slice(0, 5))}`;
}

export function formatBookingDate(dateKey, today) {
  if (dateKey === toDateKey(today)) return "النهارده";
  if (dateKey === toDateKey(addDays(today, 1))) return "بكرة";
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(parseDateKey(dateKey));
}

export function getGreeting(date) {
  return date.getHours() < 12 ? "صباح الخير" : "مساء الخير";
}

// ---------- سلاسل الرسوم ----------

function buildRevenueSeries(confirmed, today, days) {
  const byDate = new Map();
  for (const booking of confirmed) {
    const entry = byDate.get(booking.date) ?? { gross: 0, net: 0, count: 0 };
    entry.gross += Number(booking.price) || 0;
    entry.net += netOf(booking);
    entry.count += 1;
    byDate.set(booking.date, entry);
  }

  return Array.from({ length: days }, (_, index) => {
    const date = addDays(today, index - (days - 1));
    const key = toDateKey(date);
    const entry = byDate.get(key) ?? { gross: 0, net: 0 , count: 0 };
    const shortDate = `${date.getDate()}/${date.getMonth() + 1}`;
    return {
      date: key,
      label: days <= 7 ? WEEKDAYS[date.getDay()] : shortDate,
      fullLabel: `${WEEKDAYS[date.getDay()]} ${shortDate}`,
      gross: entry.gross,
      net: entry.net,
      count: entry.count,
    };
  });
}

function hourLabel(hour) {
  return `${hour % 12 === 0 ? 12 : hour % 12} ${hour >= 12 ? "م" : "ص"}`;
}

// كام حجز مؤكد بيغطي كل ساعة (آخر 30 يوم)
function buildPeakHours(confirmedLast30) {
  const counts = new Array(24).fill(0);

  for (const booking of confirmedLast30) {
    const start = timeMinutes(booking.start_time);
    const minutes = bookingMinutes(booking);
    if (!minutes) continue;
    const firstHour = Math.floor(start / 60);
    const lastHour = Math.ceil((start + minutes) / 60) - 1;
    for (let hour = firstHour; hour <= lastHour; hour += 1) counts[hour % 24] += 1;
  }

  const used = counts.map((count, hour) => (count > 0 ? hour : -1)).filter((h) => h >= 0);
  if (!used.length) return [];

  const first = Math.min(...used);
  const last = Math.max(...used);
  const result = [];
  for (let hour = first; hour <= last; hour += 1) {
    const end = hour + 1 === 24 ? "24:00" : `${pad(hour + 1)}:00`;
    result.push({
      hour,
      label: hourLabel(hour),
      fullLabel: `${formatTime(`${pad(hour)}:00`)} – ${formatTime(end)}`,
      count: counts[hour],
    });
  }
  return result;
}

// ---------- الحساب الرئيسي ----------

export function computeOverview({
  venues,
  bookings,
  workingHours,
  venueId = "all",
  today,
  commissionPercent,
}) {
  const todayKey = toDateKey(today);
  const yesterdayKey = toDateKey(addDays(today, -1));
 

  const selectedVenues =
    venueId === "all" ? venues : venues.filter((v) => String(v.id) === String(venueId));
  const selectedIds = new Set(selectedVenues.map((v) => String(v.id)));
  const scoped = bookings.filter((b) => selectedIds.has(String(b.venue_id)));
  const confirmed = scoped.filter((b) => b.status === "confirmed");
  const isLive = (booking) => LIVE_STATUSES.has(booking.status);

  // حجوزات النهارده وأمس (معلق أو مؤكد)
  const todayCount = scoped.filter((b) => b.date === todayKey && isLive(b)).length;
  const yesterdayCount = scoped.filter((b) => b.date === yesterdayKey && isLive(b)).length;

  // إيرادات الشهر الحالي لحد النهارده، ومقارنتها بنفس الفترة من الشهر اللي فات
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthStartKey = toDateKey(new Date(year, month, 1));
  const prevStartKey = toDateKey(new Date(year, month - 1, 1));
  const prevMonthDays = new Date(year, month, 0).getDate();
  const prevEndKey = toDateKey(
    new Date(year, month - 1, Math.min(today.getDate(), prevMonthDays)),
  );

  const monthGross = sumGross(
    confirmed.filter((b) => b.date >= monthStartKey && b.date <= todayKey),
  );
  const prevGross = sumGross(
    confirmed.filter((b) => b.date >= prevStartKey && b.date <= prevEndKey),
  );
 const monthNet = sumNet(
   confirmed.filter((b) => b.date >= monthStartKey && b.date <= todayKey),
 );
  const prevNet = sumNet(
    confirmed.filter((b) => b.date >= prevStartKey && b.date <= prevEndKey),
  );
  const netChangePercent =
    prevNet > 0 ? Math.round(((monthNet - prevNet) / prevNet) * 100) : null;

  // الحجوزات المعلقة من النهارده فصاعدًا
  const pendingList = scoped
    .filter((b) => b.status === "pending" && b.date >= todayKey)
    .sort(byDateTime);

  // الإشغال: آخر 7 أيام، الملاعب المفعّلة بس
  const activeIds = new Set(selectedVenues.filter((v) => v.is_active).map((v) => String(v.id)));
  const minutesByVenueDay = new Map();
  for (const row of workingHours) {
    const id = String(row.venue_id);
    if (!activeIds.has(id)) continue;
    const key = `${id}-${row.day_of_week}`;
    const length = timeMinutes(row.close_time) - timeMinutes(row.open_time);
    if (length > 0) minutesByVenueDay.set(key, (minutesByVenueDay.get(key) ?? 0) + length);
  }

  let availableMinutes = 0;
  for (let offset = 0; offset < 7; offset += 1) {
    const day = addDays(today, -offset).getDay();
    for (const id of activeIds) availableMinutes += minutesByVenueDay.get(`${id}-${day}`) ?? 0;
  }

  const weekStartKey = toDateKey(addDays(today, -6));
  const bookedMinutes = confirmed
    .filter(
      (b) => activeIds.has(String(b.venue_id)) && b.date >= weekStartKey && b.date <= todayKey,
    )
    .reduce((total, b) => total + bookingMinutes(b), 0);

  const occupancyPercent =
    availableMinutes > 0 ? Math.min(100, Math.round((bookedMinutes / availableMinutes) * 100)) : null;

  // سلاسل الرسوم
  const revenue7 = buildRevenueSeries(confirmed, today, 7);
  const revenue30 = buildRevenueSeries(confirmed, today, 30);

  const start30Key = toDateKey(addDays(today, -29));
  const confirmedLast30 = confirmed.filter((b) => b.date >= start30Key && b.date <= todayKey);
  const peakHours = buildPeakHours(confirmedLast30);

  // أكتر ملعب طلبًا (لو أكتر من ملعب وفلتر "الكل")
  let topVenue = null;
  if (venues.length > 1 && venueId === "all") {
    const counts = new Map();
    for (const booking of confirmedLast30) {
      const id = String(booking.venue_id);
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    const venue = best ? venues.find((v) => String(v.id) === best[0]) : null;
    if (venue) topVenue = { name: venue.name, count: best[1] };
  }

  // قوائم الحجوزات
  const todayList = scoped.filter((b) => b.date === todayKey).sort(byDateTime);
  const upcomingAll = scoped.filter((b) => b.date > todayKey && isLive(b)).sort(byDateTime);

  // كروت الملاعب (بتتعرض لما فيه أكتر من ملعب، فمش متأثرة بالفلتر)
  const venueCards = venues.map((venue) => {
    const own = bookings.filter((b) => String(b.venue_id) === String(venue.id));
    return {
      venue,
      todayCount: own.filter((b) => b.date === todayKey && isLive(b)).length,
      pendingCount: own.filter((b) => b.status === "pending" && b.date >= todayKey).length,
    };
  });

  return {
    todayCount,
    yesterdayCount,
    monthNet,
    monthGross,
    netChangePercent,
    pendingCount: pendingList.length,
    pendingList: pendingList.slice(0, 5),
    occupancyPercent,
    bookedHours: Math.round((bookedMinutes / 60) * 10) / 10,
    availableHours: Math.round((availableMinutes / 60) * 10) / 10,
    revenue7,
    revenue30,
    peakHours,
    topVenue,
    todayList,
    upcomingList: upcomingAll.slice(0, 8),
    venueCards,
    hiddenVenues: venues.filter((v) => !v.is_active),
    upcomingCount: upcomingAll.length,
  };
}

// ---------- خطوات البداية للأونر الجديد ----------

export function getOnboardingSteps({ venues, workingHours, paymentMethods }) {
  const withHours = new Set(workingHours.map((row) => String(row.venue_id)));
  const withPayments = new Set(paymentMethods.map((row) => String(row.venue_id)));
  const lackingHours = venues.find((v) => !withHours.has(String(v.id)));
  const lackingPayment = venues.find((v) => !withPayments.has(String(v.id)));
  const hasVenue = venues.length > 0;

  const editLink = (venue) => (venue ? `/owner/courts/${venue.id}/edit` : "/owner/courts");

  return [
    { id: "court", label: "أضف ملعبك الأول", done: hasVenue, to: "/owner/courts/new" },
    {
      id: "hours",
      label: "حدد مواعيد العمل",
      done: hasVenue && !lackingHours,
      to: hasVenue ? editLink(lackingHours) : null,
    },
    {
      id: "payment",
      label: "أضف طريقة دفع للعربون",
      done: hasVenue && !lackingPayment,
      to: hasVenue ? editLink(lackingPayment) : null,
    },
    {
      id: "visible",
      label: "اعرض الملعب للاعبين",
      done: venues.some((v) => v.is_active),
      to: hasVenue ? "/owner/courts" : null,
    },
  ];
}
