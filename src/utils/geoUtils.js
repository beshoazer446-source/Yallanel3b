// أدوات حساب المسافة الجغرافية وتحديد الإحداثيات

// إحداثيات تقريبية لمراكز المحافظات والمدن المصرية كـ Fallback
export const CITY_COORDINATES = {
  "القاهرة": { lat: 30.0444, lng: 31.2357 },
  "الجيزة": { lat: 30.0131, lng: 31.2089 },
  "الإسكندرية": { lat: 31.2001, lng: 29.9187 },
  "قنا": { lat: 26.1551, lng: 32.7160 },
  "الأقصر": { lat: 25.6872, lng: 32.6396 },
  "أسوان": { lat: 24.0889, lng: 32.8998 },
  "الدقهلية": { lat: 31.0409, lng: 31.3785 },
  "المنصورة": { lat: 31.0409, lng: 31.3785 },
  "الغربية": { lat: 30.7865, lng: 31.0004 },
  "طنطا": { lat: 30.7865, lng: 31.0004 },
  "الشرقية": { lat: 30.5877, lng: 31.5020 },
  "الزقازيق": { lat: 30.5877, lng: 31.5020 },
  "المنوفية": { lat: 30.5972, lng: 30.9876 },
  "شبين الكوم": { lat: 30.5599, lng: 31.0116 },
  "القليوبية": { lat: 30.4591, lng: 31.1786 },
  "بنها": { lat: 30.4591, lng: 31.1786 },
  "بورسعيد": { lat: 31.2653, lng: 32.3019 },
  "السويس": { lat: 29.9668, lng: 32.5498 },
  "الإسماعيلية": { lat: 30.5965, lng: 32.2715 },
  "البحر الأحمر": { lat: 27.2579, lng: 33.8116 },
  "الغردقة": { lat: 27.2579, lng: 33.8116 },
  "أسيوط": { lat: 27.1801, lng: 31.1837 },
  "سوهاج": { lat: 26.5590, lng: 31.6957 },
  "المنيا": { lat: 28.0871, lng: 30.7618 },
  "بني سويف": { lat: 29.0661, lng: 31.0994 },
  "الفيوم": { lat: 29.3084, lng: 30.8428 },
  "كفر الشيخ": { lat: 31.1107, lng: 30.9388 },
  "البحيرة": { lat: 31.0364, lng: 30.4699 },
  "دمنهور": { lat: 31.0364, lng: 30.4699 },
  "دمياط": { lat: 31.4175, lng: 31.8144 },
  "مطروح": { lat: 31.3543, lng: 27.2373 },
  "شرم الشيخ": { lat: 27.9158, lng: 34.3299 },
};

/**
 * استخراج الإحداثيات (lat, lng) من كائن الملعب
 * 1. إذا كان لديه latitude و longitude مباشرة
 * 2. أو استخراجها من رابط maps_url عبر Regex
 * 3. أو الاستعانة بإحداثيات المحافظة/المدينة التقريبية
 */
export function extractVenueCoordinates(venue) {
  if (!venue) return null;

  // 1. فحص حقول مباشرة
  const directLat = Number(venue.latitude ?? venue.lat);
  const directLng = Number(venue.longitude ?? venue.lng);
  if (Number.isFinite(directLat) && Number.isFinite(directLng)) {
    return { lat: directLat, lng: directLng, isApproximate: false };
  }

  // 2. فحص رابط خرائط جوجل maps_url
  if (venue.maps_url && typeof venue.maps_url === "string") {
    const match =
      venue.maps_url.match(/q=([+-]?\d+(?:\.\d+)?),([+-]?\d+(?:\.\d+)?)/) ||
      venue.maps_url.match(/@([+-]?\d+(?:\.\d+)?),([+-]?\d+(?:\.\d+)?)/) ||
      venue.maps_url.match(/ll=([+-]?\d+(?:\.\d+)?),([+-]?\d+(?:\.\d+)?)/);

    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng, isApproximate: false };
      }
    }
  }

  // 3. Fallback: مركز المدينة أو المحافظة
  if (venue.city && CITY_COORDINATES[venue.city]) {
    return { ...CITY_COORDINATES[venue.city], isApproximate: true };
  }
  if (venue.area && CITY_COORDINATES[venue.area]) {
    return { ...CITY_COORDINATES[venue.area], isApproximate: true };
  }

  return null;
}

/**
 * حساب المسافة بين نقطتين جغرافيتين باستخدام معادلة Haversine (بالكيلومتر)
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * تنسيق المسافة لعرضها للمستخدم بشكل لطيف
 */
export function formatDistance(distanceKm) {
  if (distanceKm == null || !Number.isFinite(distanceKm)) return "";
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} م`;
  }
  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} كم`;
  }
  return `${Math.round(distanceKm)} كم`;
}
