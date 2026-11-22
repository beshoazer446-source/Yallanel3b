import { matchPath } from "react-router-dom";

// أول حرف من أول كلمة + أول حرف من تاني كلمة، وحرف واحد لو الاسم كلمة واحدة
export function getInitials(name) {
  const words = (name || "").trim().split(/\s+/).filter(Boolean).map((word) => word.toUpperCase());
  if (words.length === 0) return "";
  const first = Array.from(words[0])[0];
  if (words.length === 1) return first;
  return first + Array.from(words[1])[0];
}

function normalize(path) {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

function matchesBase(pathname, base) {
  const current = normalize(pathname);
  const target = normalize(base);
  return current === target || current.startsWith(`${target}/`);
}

// العنصر نشط لو المسار بتاعه مطابق، أو لو المسار الحالي تحت أحد الـ activePrefixes بتاعته
export function isItemActive(item, pathname) {
  if (!item.to) return false;
  if (item.end) return normalize(pathname) === normalize(item.to);
  if (matchesBase(pathname, item.to)) return true;
  return (item.activePrefixes || []).some((prefix) =>
    matchesBase(pathname, prefix),
  );
}

// عنوان الصفحة في الهيدر. بنبدأ بالعناوين الإضافية (زي إضافة ملعب)
// عشان ماتاخدش اسم العنصر اللي بيتنور بالـ prefix.
export function getPageTitle(pathname, sections, extraTitles = []) {
  for (const extra of extraTitles) {
    if (matchPath({ path: extra.path, end: true }, pathname)) {
      return extra.title;
    }
  }

  for (const section of sections) {
    for (const item of section.items) {
      if (isItemActive(item, pathname)) return item.label;
    }
  }

  return "";
}
