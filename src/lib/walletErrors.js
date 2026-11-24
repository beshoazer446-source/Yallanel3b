// رسائل الـ DB -> رسائل عربي مفهومة. بنطابق بجزء من النص.
const ERROR_MESSAGES = [
  ["minimum withdrawal is 100", "الحد الأدنى للسحب هو 100 ج.م."],
  ["insufficient balance", "رصيدك المتاح غير كافٍ لهذا المبلغ."],
  ["wallet not found", "لم يتم العثور على محفظتك. أول حجز مؤكد هينشئها تلقائيًا."],
  ["admin only", "هذه العملية متاحة للإدارة فقط."],
  ["request not pending", "هذا الطلب تمت معالجته بالفعل."],
  ["too late to cancel", "فات الوقت المسموح لإلغاء هذا الحجز."],
  ["booking cannot be cancelled", "لا يمكن إلغاء هذا الحجز."],
  ["booking not found", "لم يتم العثور على الحجز."],
  ["invalid payout method", "طريقة السحب غير صحيحة."],
  ["payout details required", "اكتب رقم الموبايل أو بيانات الحساب (من 5 إلى 100 حرف)."],
  ["failed to fetch", "تعذر الاتصال بالإنترنت. تأكد من الاتصال وحاول مرة أخرى."],
];

export function getWalletErrorMessage(
  error,
  fallback = "حدث خطأ غير متوقع. حاول مرة أخرى.",
) {
  const message = String(error?.message ?? error ?? "").toLowerCase();
  const match = ERROR_MESSAGES.find(([key]) => message.includes(key));
  return match ? match[1] : fallback;
}