// src/services/venuesService.js
import { venues } from "../data/mockData";

// جلب الملاعب النشطة
export async function getVenues() {
  // ملاحظة: لاحقاً عند ربط Supabase، سيتم استبدال هذا السطر بدالة الجلب من القاعدة
  return venues.filter((v) => v.is_active);
}

// البحث عن الملاعب بالاسم أو العنوان
export async function searchVenues(searchTerm) {
  const allVenues = await getVenues();
  if (!searchTerm) return allVenues;

  return allVenues.filter(
    (v) =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.address.toLowerCase().includes(searchTerm.toLowerCase()),
  );
}

// جلب تفاصيل ملعب معين بواسطة الـ id
export async function getVenueById(venueId) {
  const allVenues = await getVenues();
  return allVenues.find((v) => v.id === venueId);
}
