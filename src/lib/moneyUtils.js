// أدوات الفلوس: كل الحسابات والمقارنات بالقروش (أعداد صحيحة) بدل الكسور العشرية.
// التنسيق للعرض بس.
export const CURRENCY_LABEL = "ج.م";
export const MIN_WITHDRAWAL_CENTS = 10000; // 100 ج.م

// يحوّل قيمة numeric جاية من الـ DB (رقم أو نص) لقروش، وبيرجع null لو القيمة مش مفهومة
export function toCents(value) {
  if (value === null || value === undefined) return null;
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(String(value).trim());
  if (!match) return null;
  const [, sign, whole, fraction = ""] = match;
  const cents =
    Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
  return sign ? -cents : cents;
}

// 125050 -> "1,250.50"
export function formatCents(cents) {
  const abs = Math.abs(cents);
  const whole = String(Math.trunc(abs / 100)).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ",",
  );
  const fraction = String(abs % 100).padStart(2, "0");
  return `${cents < 0 ? "-" : ""}${whole}.${fraction}`;
}

export function formatMoney(value) {
  return formatCents(toCents(value) ?? 0);
}

export function sumCents(values) {
  return values.reduce((total, value) => total + (toCents(value) ?? 0), 0);
}

// 15050 -> "150.50" (الصيغة اللي بنبعتها للـ DB)
export function centsToDecimalString(cents) {
  const abs = Math.abs(cents);
  return `${cents < 0 ? "-" : ""}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

// مدخل المستخدم -> قروش. بيقبل الأرقام العربي، وبيرجع null لو مش صالح أو صفر
export function parseAmountToCents(input) {
  const text = String(input ?? "")
    .trim()
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632))
    .replace("٫", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const cents = toCents(text);
  return cents > 0 ? cents : null;
}