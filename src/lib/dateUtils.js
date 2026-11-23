// تواريخ بتوقيت الجهاز (مفتاح اليوم بصيغة YYYY-MM-DD زي عمود date في bookings)

export function toDateKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// بيرجع بداية اليوم بعد إضافة (أو طرح) عدد أيام
export function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}
