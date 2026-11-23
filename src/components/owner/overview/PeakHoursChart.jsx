import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Panel from "../../dashboard/ui/Panel";

function PeakTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="overview-tooltip" dir="rtl">
      <strong>{item.fullLabel}</strong>
      <span>{item.count} حجز مؤكد</span>
    </div>
  );
}

// أكتر الأوقات طلبًا (آخر 30 يوم). أعلى ساعة بلون مميز.
export default function PeakHoursChart({ data }) {
  const maxCount = Math.max(0, ...data.map((item) => item.count));
  const peak = data.find((item) => item.count === maxCount);

  return (
    <Panel
      title="أكتر الأوقات طلبًا"
      description={
        peak && maxCount > 0
          ? `الذروة: ${peak.fullLabel} (آخر 30 يوم)`
          : "حجوزات آخر 30 يوم حسب الساعة"
      }
    >
      {data.length === 0 ? (
        <p className="overview-empty">لسه مفيش حجوزات مؤكدة كفاية للتحليل.</p>
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
                minTickGap={8}
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              />
              <YAxis
                orientation="right"
                width={32}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              />
              <Tooltip cursor={{ fill: "var(--bg-dashboard)" }} content={<PeakTooltip />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={32}>
                {data.map((item) => (
                  <Cell
                    key={item.hour}
                    fill={item.count === maxCount ? "var(--yellow)" : "var(--status-confirmed)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}
