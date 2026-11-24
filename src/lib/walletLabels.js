import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Undo2,
} from "lucide-react";

// direction: in = زيادة، out = خصم، internal = تحويل داخلي بين المعلّق والمتاح
export const TRANSACTION_TYPES = {
  deposit_credit: {
    label: "عربون حجز",
    note: "أُضيف للرصيد المعلّق",
    direction: "in",
    icon: ArrowDownLeft,
  },
  release: {
    label: "تحويل للرصيد المتاح",
    note: "انتقل من المعلّق إلى المتاح بعد انتهاء الحجز",
    direction: "internal",
    icon: ArrowLeftRight,
  },
  refund: {
    label: "استرجاع عربون - إلغاء حجز",
    note: "خُصم من الرصيد المعلّق",
    direction: "out",
    icon: Undo2,
  },
  withdrawal: {
    label: "طلب سحب",
    note: "خُصم من الرصيد المتاح",
    direction: "out",
    icon: ArrowUpRight,
  },
  withdrawal_rejected: {
    label: "رفض السحب - رجوع المبلغ",
    note: "رجع إلى الرصيد المتاح",
    direction: "in",
    icon: ArrowDownLeft,
  },
};

export function getTransactionConfig(type) {
  return (
    TRANSACTION_TYPES[type] ?? {
      label: type,
      note: "",
      direction: "internal",
      icon: ArrowLeftRight,
    }
  );
}

export const PAYOUT_METHODS = [
  {
    value: "vodafone_cash",
    label: "فودافون كاش",
    detailsLabel: "رقم الموبايل",
    placeholder: "01xxxxxxxxx",
  },
  {
    value: "instapay",
    label: "إنستاباي",
    detailsLabel: "عنوان إنستاباي أو رقم الموبايل",
    placeholder: "name@instapay",
  },
  {
    value: "bank_transfer",
    label: "تحويل بنكي",
    detailsLabel: "رقم الحساب أو الـ IBAN",
    placeholder: "رقم الحساب",
  },
];

export function getPayoutMethod(value) {
  return PAYOUT_METHODS.find((method) => method.value === value) ?? null;
}

// يخفي بيانات الدفع ويسيب آخر 4 بس (للعرض عند الأونر)
export function maskPayoutDetails(details) {
  const text = String(details ?? "").trim();
  if (text.length <= 4) return text;
  return `${"•".repeat(Math.min(6, text.length - 4))}${text.slice(-4)}`;
}

export function formatWalletDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}