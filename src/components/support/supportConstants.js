export const TICKET_CATEGORIES = [
  { value: "payment", label: "مشكلة في الدفع" },
  { value: "booking", label: "مشكلة في الحجز" },
  { value: "court", label: "مشكلة في الملعب أو الإعلان" },
  { value: "wallet", label: "مشكلة في المحفظة" },
  { value: "account", label: "مشكلة في الحساب" },
  { value: "other", label: "أخرى" },
];

// tone بيحدد لون الشارة (success / warning / danger / muted)
export const TICKET_STATUSES = [
  { value: "open", label: "مفتوحة", tone: "warning" },
  { value: "pending", label: "قيد الانتظار", tone: "muted" },
  { value: "resolved", label: "تم الحل", tone: "success" },
  { value: "closed", label: "مغلقة", tone: "muted" },
];

export const TICKET_PRIORITIES = [
  { value: "low", label: "منخفضة", tone: "muted" },
  { value: "normal", label: "عادية", tone: "muted" },
  { value: "high", label: "عالية", tone: "danger" },
];

export const REQUESTER_ROLE_LABELS = {
  owner: "صاحب ملعب",
  user: "لاعب",
};

export function getOption(options, value) {
  return options.find((option) => option.value === value);
}

export function getCategoryLabel(value) {
  return getOption(TICKET_CATEGORIES, value)?.label ?? value;
}
