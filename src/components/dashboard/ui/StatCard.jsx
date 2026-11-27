import { Minus, TrendingDown, TrendingUp } from "lucide-react";

// كارت رقم. delta = { value: رقم أو null, label } و progress = 0..100 (اختياري)
export default function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  hint,
  delta,
  progress,
  tone = "default",
}) {
  let deltaView = null;
  if (delta && delta.value !== null && delta.value !== undefined) {
    const direction = delta.value > 0 ? "up" : delta.value < 0 ? "down" : "flat";
    const DeltaIcon = direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus;
    const sign = delta.value > 0 ? "+" : "";
    deltaView = (
      <p className={`dash-stat-delta is-${direction}`}>
        <DeltaIcon size={16} aria-hidden="true" />
        <span dir="ltr">
          {sign}
          {delta.value}%
        </span>
        <span className="dash-stat-delta-label">{delta.label}</span>
      </p>
    );
  }

  return (
    <article className={`dash-stat is-${tone}`}>
      <div className="dash-stat-head">
        <span className="dash-stat-label">{label}</span>
        {Icon ? (
          <span className="dash-stat-icon">
            <Icon size={18} aria-hidden="true" />
          </span>
        ) : null}
      </div>

      <div className="dash-stat-value">
        {value}
        {unit ? <small>{unit}</small> : null}
      </div>

      {typeof progress === "number" ? (
        <div
          className="dash-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label={label}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      ) : null}

      {deltaView}
      {hint ? <p className="dash-stat-hint">{hint}</p> : null}
    </article>
  );
}
