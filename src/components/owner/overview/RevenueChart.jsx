import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Panel from "../../dashboard/ui/Panel";
import { formatMoney } from "./overviewStats";

function compact(value) {
  return value >= 1000 ? `${Math.round(value / 100) / 10}k` : value;
}

function RevenueTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="overview-tooltip" dir="rtl">
      <strong>{item.fullLabel}</strong>
      <span>الصافي: {formatMoney(item.net)} ج.م</span>
      <span>{item.count} حجز مؤكد</span>
    </div>
  );
}

// صافي الإيراد اليومي بعد العمولة. المحور الأفقي معكوس والرأسي على اليمين عشان RTL.
export default function RevenueChart({ data7, data30 }) {
  const [range, setRange] = useState(7);
  const data = range === 7 ? data7 : data30;
  const total = data.reduce((sum, item) => sum + item.net, 0);

  return (
    <Panel
      title="الإيرادات"
      description={`صافي ${range === 7 ? "آخر 7 أيام" : "آخر 30 يوم"}: ${formatMoney(total)} ج.م`}
      action={
        <div className="dash-chip-group" role="group" aria-label="مدة الرسم">
          {[7, 30].map((value) => (
            <button
              type="button"
              key={value}
              className={`dash-chip${range === value ? " is-selected" : ""}`}
              aria-pressed={range === value}
              onClick={() => setRange(value)}
            >
              {value} يوم
            </button>
          ))}
        </div>
      }
    >
      {total === 0 ? (
        <p className="overview-empty">مفيش إيرادات مؤكدة في الفترة دي.</p>
      ) : (
        <div className="overview-chart" dir="ltr">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="label"
                reversed
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={12}
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              />
              <YAxis
                orientation="right"
                width={44}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tickFormatter={compact}
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              />
              <Tooltip cursor={{ fill: "var(--bg-dashboard)" }} content={<RevenueTooltip />} />
              <Bar dataKey="net" fill="var(--yellow)" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}
