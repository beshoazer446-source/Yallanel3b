// منطق مواعيد العمل: الأسبوع = 7 أيام، كل يوم { open, periods: [{ open_time, close_time }] }
// الأيام المقفولة بتحتفظ بفتراتها في الـ state بس بتتتجاهل وقت الحفظ.

export const DAYS = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

export function createEmptyPeriod() {
  return { open_time: "", close_time: "" };
}

export function createDefaultWeek() {
  return DAYS.map(() => ({ open: true, periods: [createEmptyPeriod()] }));
}

function clonePeriods(periods) {
  return periods.map((period) => ({ ...period }));
}

export function normalizeTime(time) {
  return typeof time === "string" ? time.slice(0, 5) : "";
}

// "HH:MM" -> دقائق ("24:00" = 1440)
export function toMinutes(time) {
  if (!time) return NaN;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// 16:00 -> "4:00 م"، و24:00 أو 00:00 -> "12:00 ص"
export function formatTime(time) {
  if (!time) return "";
  if (time === "24:00") return "12:00 ص";
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "م" : "ص";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function isComplete(period) {
  return Boolean(period.open_time && period.close_time);
}

function sortedComplete(periods) {
  return periods
    .filter(
      (period) =>
        isComplete(period) &&
        toMinutes(period.open_time) < toMinutes(period.close_time),
    )
    .sort((a, b) => toMinutes(a.open_time) - toMinutes(b.open_time));
}

export function hasCompletePeriod(periods) {
  return sortedComplete(periods).length > 0;
}

// رسالة خطأ لكل فترة (نص فاضي = سليمة)
export function validatePeriods(periods) {
  const errors = periods.map(() => "");

  periods.forEach((period, index) => {
    const hasOpen = Boolean(period.open_time);
    const hasClose = Boolean(period.close_time);
    if (!hasOpen && !hasClose) return;
    if (!hasOpen || !hasClose) {
      errors[index] = "أكمل وقت الفتح ووقت الإغلاق.";
      return;
    }
    if (toMinutes(period.open_time) >= toMinutes(period.close_time)) {
      errors[index] = "وقت الإغلاق لازم يكون بعد وقت الفتح.";
    }
  });

  const valid = periods
    .map((period, index) => ({ period, index }))
    .filter(({ period, index }) => isComplete(period) && !errors[index])
    .sort(
      (a, b) => toMinutes(a.period.open_time) - toMinutes(b.period.open_time),
    );

  for (let i = 1; i < valid.length; i += 1) {
    const previous = valid[i - 1];
    const current = valid[i];
    if (
      toMinutes(previous.period.close_time) > toMinutes(current.period.open_time)
    ) {
      const message = "الفترة دي بتتداخل مع فترة تانية.";
      if (!errors[current.index]) errors[current.index] = message;
      if (!errors[previous.index]) errors[previous.index] = message;
    }
  }

  return errors;
}

// الفراغات بين الفترات (الاستراحات)
export function getBreaks(periods) {
  const valid = sortedComplete(periods);
  const breaks = [];
  for (let i = 1; i < valid.length; i += 1) {
    const from = valid[i - 1].close_time;
    const to = valid[i].open_time;
    if (toMinutes(to) > toMinutes(from)) breaks.push({ from, to });
  }
  return breaks;
}

function describePeriods(periods) {
  return sortedComplete(periods)
    .map(
      (period) =>
        `من ${formatTime(period.open_time)} إلى ${formatTime(period.close_time)}`,
    )
    .join("، ");
}

function describeDays(indexes) {
  const runs = [];
  let start = indexes[0];
  let previous = indexes[0];
  for (let i = 1; i < indexes.length; i += 1) {
    if (indexes[i] === previous + 1) {
      previous = indexes[i];
    } else {
      runs.push([start, previous]);
      start = indexes[i];
      previous = indexes[i];
    }
  }
  runs.push([start, previous]);

  return runs
    .map(([first, last]) => {
      if (first === last) return DAYS[first];
      if (last === first + 1) return `${DAYS[first]} و${DAYS[last]}`;
      return `${DAYS[first]} إلى ${DAYS[last]}`;
    })
    .join("، ");
}

// ملخص بالعربي: سطر لكل مجموعة أيام ليها نفس المواعيد + سطر للأيام المقفولة
export function summarizeWeek(week) {
  const groups = new Map();
  const closed = [];

  week.forEach((day, index) => {
    if (!day.open) {
      closed.push(index);
      return;
    }
    const text = describePeriods(day.periods);
    if (text) groups.set(text, [...(groups.get(text) ?? []), index]);
  });

  const lines = [...groups.entries()].map(
    ([text, indexes]) => `${describeDays(indexes)}: ${text}`,
  );
  if (closed.length) lines.push(`مغلق: ${describeDays(closed)}`);
  return lines;
}

function signature(periods) {
  return JSON.stringify(
    sortedComplete(periods).map((p) => [p.open_time, p.close_time]),
  );
}

// كل الأيام المفتوحة ليها نفس الفترات؟
export function isUniform(week) {
  const open = week.filter((day) => day.open);
  if (open.length === 0) return true;
  const first = signature(open[0].periods);
  return open.every((day) => signature(day.periods) === first);
}

export function getTemplate(week) {
  return (week.find((day) => day.open) ?? week[0]).periods;
}

export function applyTemplate(week, periods) {
  return week.map((day) => ({ ...day, periods: clonePeriods(periods) }));
}

// صفوف جدول venue_working_hours -> أسبوع
export function weekFromRows(rows) {
  const byDay = DAYS.map(() => []);
  rows.forEach((row) => {
    if (byDay[row.day_of_week]) {
      byDay[row.day_of_week].push({
        open_time: normalizeTime(row.open_time),
        close_time: normalizeTime(row.close_time),
      });
    }
  });
  byDay.forEach((periods) =>
    periods.sort((a, b) => toMinutes(a.open_time) - toMinutes(b.open_time)),
  );

  const firstOpen = byDay.find((periods) => periods.length);
  const template = firstOpen ?? [createEmptyPeriod()];

  return byDay.map((periods) =>
    periods.length
      ? { open: true, periods }
      : { open: false, periods: clonePeriods(template) },
  );
}

// أسبوع -> صفوف للحفظ (الأيام المفتوحة والفترات المكتملة بس)
export function weekToRows(week) {
  return week.flatMap((day, dayIndex) =>
    day.open
      ? sortedComplete(day.periods).map((period) => ({
          day_of_week: dayIndex,
          open_time: period.open_time,
          close_time: period.close_time,
        }))
      : [],
  );
}

// رسالة خطأ أو ""
export function validateWeek(week) {
  for (let index = 0; index < week.length; index += 1) {
    const day = week[index];
    if (!day.open) continue;

    const errors = validatePeriods(day.periods);
    const firstError = errors.find(Boolean);
    if (firstError) return `راجع مواعيد يوم ${DAYS[index]}: ${firstError}`;

    if (!hasCompletePeriod(day.periods)) {
      return `يوم ${DAYS[index]} مفتوح لكن مفيهوش فترة عمل. أضف فترة أو اجعله مغلقًا.`;
    }
  }
  return "";
}

// لحماية المسودة: لو الشكل مش سليم بنرجع null
export function normalizeWeek(week) {
  if (!Array.isArray(week) || week.length !== DAYS.length) return null;
  const valid = week.every(
    (day) => day && Array.isArray(day.periods) && day.periods.length > 0,
  );
  if (!valid) return null;
  return week.map((day) => ({
    open: Boolean(day.open),
    periods: day.periods.map((period) => ({
      open_time: normalizeTime(period.open_time),
      close_time: normalizeTime(period.close_time),
    })),
  }));
}
