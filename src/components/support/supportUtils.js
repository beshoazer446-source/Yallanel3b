import { addDays, toDateKey } from "../../lib/dateUtils";
import { formatTime } from "../owner/court-form/workingHours";

function pad(value) {
  return String(value).padStart(2, "0");
}

export function formatTimeOfDay(iso) {
  const date = new Date(iso);
  return formatTime(`${pad(date.getHours())}:${pad(date.getMinutes())}`);
}

// "النهارده" / "أمس" / تاريخ كامل
export function formatDayLabel(iso, now = new Date()) {
  const date = new Date(iso);
  const key = toDateKey(date);
  if (key === toDateKey(now)) return "النهارده";
  if (key === toDateKey(addDays(now, -1))) return "أمس";
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

// في القوايم: الوقت لو النهارده، وإلا اليوم والشهر
export function formatTicketDate(iso, now = new Date()) {
  const date = new Date(iso);
  if (toDateKey(date) === toDateKey(now)) return formatTimeOfDay(iso);
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatFullDate(iso) {
  return `${formatDayLabel(iso)} · ${formatTimeOfDay(iso)}`;
}

// دمج رسائل جديدة مع الموجودة (بالـ id)، ونسخة السيرفر هي الأصح
export function mergeMessages(previous, incoming) {
  const byId = new Map(previous.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at),
  );
}

export function sameMessages(a, b) {
  return (
    a.length === b.length &&
    a.every((message, index) => message.id === b[index].id && message.is_read === b[index].is_read)
  );
}
