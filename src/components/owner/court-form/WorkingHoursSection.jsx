import { CalendarDays, Copy } from "lucide-react";
import { useState } from "react";
import ConfirmDialog from "../../dashboard/ui/ConfirmDialog";
import SectionCard from "../../dashboard/ui/SectionCard";
import PeriodsEditor from "./PeriodsEditor";
import {
  DAYS,
  applyTemplate,
  getTemplate,
  hasCompletePeriod,
  isUniform,
  summarizeWeek,
} from "./workingHours";

// العرض البسيط: أيام مفتوحة + فترات واحدة لكلهم. العرض التفصيلي: كل يوم لوحده.
export default function WorkingHoursSection({
  week,
  onWeekChange,
  uniform,
  onUniformChange,
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const summary = summarizeWeek(week);
  const firstOpenIndex = Math.max(
    week.findIndex((day) => day.open),
    0,
  );

  function toggleDay(index) {
    onWeekChange(
      week.map((day, i) => (i === index ? { ...day, open: !day.open } : day)),
    );
  }

  function changeDayPeriods(index, periods) {
    onWeekChange(week.map((day, i) => (i === index ? { ...day, periods } : day)));
  }

  function copyToOthers(index) {
    const source = week[index].periods;
    onWeekChange(
      week.map((day, i) =>
        i === index ? day : { ...day, periods: source.map((period) => ({ ...period })) },
      ),
    );
  }

  function goUniform() {
    onWeekChange(applyTemplate(week, getTemplate(week)));
    onUniformChange(true);
    setConfirmOpen(false);
  }

  function requestUniform() {
    if (isUniform(week)) goUniform();
    else setConfirmOpen(true);
  }

  const summaryBox = summary.length ? (
    <div className="court-summary" aria-live="polite">
      <CalendarDays size={18} aria-hidden="true" />
      <div>
        {summary.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <SectionCard
      title="مواعيد العمل"
      description="حدد الأيام والفترات اللي الملعب متاح فيها للحجز."
    >
      {uniform ? (
        <>
          <div className="dash-field">
            <span className="dash-label">الأيام المفتوحة</span>
            <div className="dash-chip-group" role="group" aria-label="الأيام المفتوحة">
              {DAYS.map((dayName, index) => (
                <button
                  type="button"
                  key={dayName}
                  className={`dash-chip${week[index].open ? " is-selected" : ""}`}
                  aria-pressed={week[index].open}
                  onClick={() => toggleDay(index)}
                >
                  {dayName}
                </button>
              ))}
            </div>
          </div>

          <PeriodsEditor
            label="كل الأيام"
            periods={getTemplate(week)}
            onChange={(periods) => onWeekChange(applyTemplate(week, periods))}
          />

          {summaryBox}

          <button
            type="button"
            className="court-link-btn"
            onClick={() => onUniformChange(false)}
          >
            تخصيص كل يوم على حدة ←
          </button>
        </>
      ) : (
        <>
          <div className="court-days">
            {DAYS.map((dayName, index) => {
              const day = week[index];
              return (
                <div className={`court-day${day.open ? "" : " is-closed"}`} key={dayName}>
                  <div className="court-day-head">
                    <label className="court-day-toggle">
                      <input
                        type="checkbox"
                        role="switch"
                        className="dash-switch"
                        checked={day.open}
                        onChange={() => toggleDay(index)}
                      />
                      <strong>{dayName}</strong>
                      <span className="court-day-state">{day.open ? "مفتوح" : "مغلق"}</span>
                    </label>

                    {day.open ? (
                      <button
                        type="button"
                        className="dash-btn dash-btn-ghost"
                        disabled={!hasCompletePeriod(day.periods)}
                        onClick={() => copyToOthers(index)}
                      >
                        <Copy size={16} aria-hidden="true" />
                        نسخ المواعيد لباقي الأيام
                      </button>
                    ) : null}
                  </div>

                  {day.open ? (
                    <PeriodsEditor
                      label={dayName}
                      periods={day.periods}
                      onChange={(periods) => changeDayPeriods(index, periods)}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>

          {summaryBox}

          <button type="button" className="court-link-btn" onClick={requestUniform}>
            → العودة للعرض البسيط (نفس المواعيد لكل الأيام)
          </button>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="توحيد المواعيد؟"
        message={`المواعيد المختلفة هتتوحد على مواعيد يوم ${DAYS[firstOpenIndex]} (أول يوم مفتوح) لكل الأيام.`}
        confirmLabel="توحيد المواعيد"
        onConfirm={goUniform}
        onCancel={() => setConfirmOpen(false)}
      />
    </SectionCard>
  );
}
