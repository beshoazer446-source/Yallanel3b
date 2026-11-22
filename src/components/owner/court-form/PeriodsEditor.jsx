import { Coffee, Plus, Trash2 } from "lucide-react";
import {
  createEmptyPeriod,
  formatTime,
  getBreaks,
  validatePeriods,
} from "./workingHours";

// قايمة فترات (من - إلى) ليوم أو لكل الأيام، مع أخطاء لحظية وعرض الاستراحات
export default function PeriodsEditor({ periods, onChange, label }) {
  const errors = validatePeriods(periods);
  const breaks = getBreaks(periods);

  function updatePeriod(index, changes) {
    onChange(
      periods.map((period, i) => (i === index ? { ...period, ...changes } : period)),
    );
  }

  return (
    <div className="court-periods">
      {periods.map((period, index) => {
        const midnight = period.close_time === "24:00";
        return (
          <div className="court-period" key={index}>
            <div className="court-period-top">
              <strong>{periods.length > 1 ? `الفترة ${index + 1}` : "ساعات العمل"}</strong>
              {periods.length > 1 ? (
                <button
                  type="button"
                  className="court-icon-btn"
                  aria-label={`حذف الفترة ${index + 1}`}
                  onClick={() => onChange(periods.filter((_, i) => i !== index))}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              ) : null}
            </div>

            <div className="court-period-fields">
              <label className="court-time-field">
                <span>من</span>
                <input
                  className="dash-input"
                  type="time"
                  aria-label={`${label}: وقت الفتح للفترة ${index + 1}`}
                  value={period.open_time}
                  onChange={(event) => updatePeriod(index, { open_time: event.target.value })}
                />
              </label>

              <label className="court-time-field">
                <span>إلى</span>
                <input
                  className="dash-input"
                  type="time"
                  aria-label={`${label}: وقت الإغلاق للفترة ${index + 1}`}
                  disabled={midnight}
                  value={midnight ? "" : period.close_time}
                  onChange={(event) => updatePeriod(index, { close_time: event.target.value })}
                />
              </label>

              <label className="court-midnight">
                <input
                  type="checkbox"
                  checked={midnight}
                  onChange={(event) =>
                    updatePeriod(index, { close_time: event.target.checked ? "24:00" : "" })
                  }
                />
                حتى منتصف الليل
              </label>
            </div>

            {errors[index] ? (
              <p className="dash-field-error" role="alert">
                {errors[index]}
              </p>
            ) : null}
          </div>
        );
      })}

      {breaks.map((item) => (
        <p className="court-break" key={`${item.from}-${item.to}`}>
          <Coffee size={16} aria-hidden="true" />
          استراحة من {formatTime(item.from)} إلى {formatTime(item.to)}
        </p>
      ))}

      <div className="court-periods-add">
        <button
          type="button"
          className="dash-btn dash-btn-secondary"
          onClick={() => onChange([...periods, createEmptyPeriod()])}
        >
          <Plus size={16} aria-hidden="true" />
          إضافة فترة
        </button>
        <span className="dash-hint">لو عندك استراحة أو وقت مش متاح للحجز.</span>
      </div>
    </div>
  );
}
