import { EGYPT_LOCATIONS } from "../../../data/egyptLocations";
import { validateWeek, weekToRows } from "./workingHours";

export const EMPTY_FIELDS = {
  name: "",
  city: "",
  area: "",
  address: "",
  maps_url: "",
  description: "",
  price_per_hour: "",
  is_active: true,
};

export const AMENITY_OPTIONS = [
  "إضاءة ليلية",
  "غرف تبديل",
  "دشات وحمامات",
  "كافيتريا",
  "مواقف سيارات",
  "مياه شرب",
  "مدرجات للمشاهدين",
  "تأجير كرات وأطقم",
  "إسعافات أولية",
  "واي فاي",
  "مصلى",
  "كاميرات مراقبة",
];

export function normalizeText(value) {
  return typeof value === "string" ? value : "";
}

// الملاعب القديمة كانت بتخزن حجم الملعب جوه المميزات (زي "ملعب خماسي (5×5)")
function isPitchTypeAmenity(item) {
  return /5\s*[×x]\s*5|7\s*[×x]\s*7|8\s*[×x]\s*8|11\s*[×x]\s*11|خماسي|سباعي|ثماني|قانوني/.test(
    item,
  );
}

// مصفوفة أو نص بفواصل -> مصفوفة نضيفة من غير حجم الملعب ولا تكرار
export function parseAmenities(raw) {
  let list = [];
  if (Array.isArray(raw)) list = raw;
  else if (typeof raw === "string") list = raw.split(",");

  const seen = new Set();
  const result = [];
  for (const item of list) {
    const text = typeof item === "string" ? item.trim() : "";
    if (!text || isPitchTypeAmenity(text) || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
  }
  return result;
}

// المنطقة مكتوبة يدوي (مش من قايمة المحافظة)؟
export function isCustomArea(city, area) {
  const areas = EGYPT_LOCATIONS[city] || [];
  return Boolean(area) && !areas.includes(area);
}

// رسالة خطأ أو "" لو كله تمام
export function validateCourtForm({ fields, week, paymentMethods }) {
  if (!normalizeText(fields.name).trim() || !normalizeText(fields.address).trim()) {
    return "اسم الملعب والعنوان مطلوبان.";
  }
  if (!normalizeText(fields.city).trim()) return "يرجى اختيار المحافظة.";
  if (!normalizeText(fields.area).trim()) {
    return "يرجى اختيار المنطقة أو كتابة اسمها.";
  }

  const hoursError = validateWeek(week);
  if (hoursError) return hoursError;
  if (fields.is_active && weekToRows(week).length === 0) {
    return "أضف فترة عمل واحدة على الأقل قبل عرض الملعب للاعبين.";
  }

  const price = Number(fields.price_per_hour);
  if (!Number.isFinite(price) || price <= 0) {
    return "سعر الساعة لازم يكون أكبر من صفر.";
  }

  const incomplete = paymentMethods.some(
    (method) =>
      !normalizeText(method.method) || !normalizeText(method.account).trim(),
  );
  if (incomplete) return "أكمل طريقة الدفع ورقم الحساب أو احذف الصف غير المكتمل.";
  if (fields.is_active && paymentMethods.length === 0) {
    return "أضف طريقة دفع واحدة على الأقل قبل عرض الملعب للاعبين.";
  }

  return "";
}

// الـ payload اللي بيتبعت لجدول venues (من غير cancellation_hours)
export function buildVenuePayload({ fields, amenities, slotMinutes }) {
  return {
    name: normalizeText(fields.name).trim(),
    city: normalizeText(fields.city).trim(),
    area: normalizeText(fields.area).trim(),
    address: normalizeText(fields.address).trim(),
    maps_url: normalizeText(fields.maps_url).trim() || null,
    description: normalizeText(fields.description).trim(),
    price_per_hour: Number(fields.price_per_hour),
    slot_minutes: slotMinutes,
    amenities,
    is_active: Boolean(fields.is_active),
  };
}
