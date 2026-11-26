import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CalendarX,
  CircleAlert,
  CircleCheck,
  ImageOff,
  MapPinned,
  Plus,
  ShieldCheck,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  computeOverview,
  getActivities,
  getPendingVenues,
  loadOverviewRaw,
} from "../../services/adminOverviewService";
import { useAdminData } from "./adminShared";
import "./admin-overview.css";

const PERIODS = [
  { days: 30, label: "30 يوم", long: "آخر 30 يوم" },
  { days: 90, label: "90 يوم", long: "آخر 90 يوم" },
  { days: 180, label: "6 أشهر", long: "آخر 6 أشهر" },
  { days: 365, label: "سنة", long: "آخر سنة" },
];

const money = (n) => `${Math.round(n).toLocaleString("en-US")} ج.م`;
const rtf = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });

function timeAgo(value) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-Math.floor(hours / 24), "day");
}

const ACTIVITY_STYLES = {
  booking: { icon: CalendarDays, color: "#22c55e" },
  cancel: { icon: CalendarX, color: "#ef4444" },
  venue: { icon: Plus, color: "#3b82f6" },
  approved: { icon: CircleCheck, color: "#22c55e" },
  rejected: { icon: CircleAlert, color: "#ef4444" },
  user: { icon: UserPlus, color: "#f59e0b" },
};

function Change({ value }) {
  if (value === null)
    return (
      <span className="ov-change is-flat">لا توجد فترة سابقة للمقارنة</span>
    );
  const up = value >= 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span className={`ov-change ${up ? "is-up" : "is-down"}`}>
      <Icon size={14} aria-hidden="true" />
      <span dir="ltr">{Math.abs(value).toFixed(1)}%</span>
      <small>عن الفترة السابقة</small>
    </span>
  );
}

function StatCard({ icon: Icon, color, value, label, change }) {
  return (
    <article className="card ov-stat">
      <span className="ov-stat-icon" style={{ background: color }}>
        <Icon size={26} aria-hidden="true" />
      </span>
      <div>
        <strong className="ov-stat-value">{value}</strong>
        <p className="ov-muted">{label}</p>
        <Change value={change} />
      </div>
    </article>
  );
}

function Thumb({ src, alt }) {
  return src ? (
    <img className="ov-thumb" src={src} alt={alt} loading="lazy" />
  ) : (
    <span className="ov-thumb ov-thumb-empty" aria-hidden="true">
      <ImageOff size={18} />
    </span>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="ov-tooltip">
      <strong>{money(point.value)}</strong>
      <span>{point.label}</span>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: raw, error, reload } = useAdminData(loadOverviewRaw);
  const [days, setDays] = useState(30);

  const overview = useMemo(
    () => (raw ? computeOverview(raw, days) : null),
    [raw, days],
  );
  const pending = useMemo(() => (raw ? getPendingVenues(raw) : null), [raw]);
  const activities = useMemo(() => (raw ? getActivities(raw) : []), [raw]);

  if (error) {
    return (
      <div className="card ov-state" role="alert">
        <CircleAlert size={28} aria-hidden="true" />
        <p>{error}</p>
        <button type="button" className="btn btn-primary" onClick={reload}>
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (!raw || !overview) {
    return (
      <div className="ov-page" aria-busy="true">
        <div className="ov-stats">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card ov-skeleton" style={{ height: 120 }} />
          ))}
        </div>
        <div
          className="card ov-skeleton"
          style={{ height: 320, marginTop: 20 }}
        />
      </div>
    );
  }

  const { stats, chartData, topVenues } = overview;
  const hasChartData = chartData.some((point) => point.value > 0);

  return (
    <div className="ov-page">
      <section className="ov-welcome">
        <div>
          <h2>مرحباً بك في لوحة التحكم 👋</h2>
          <p className="ov-muted">إليك نظرة عامة على حالة المنصة اليوم</p>
        </div>
        <label className="ov-period">
          <CalendarDays size={16} aria-hidden="true" />
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            aria-label="الفترة الزمنية"
          >
            {PERIODS.map((p) => (
              <option key={p.days} value={p.days}>
                {p.long}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="ov-stats">
        <StatCard
          icon={Users}
          color="#f59e0b"
          value={stats.users.total.toLocaleString("en-US")}
          label="إجمالي المستخدمين"
          change={stats.users.change}
        />
        <StatCard
          icon={MapPinned}
          color="#8b5cf6"
          value={stats.venues.total.toLocaleString("en-US")}
          label="إجمالي الملاعب"
          change={stats.venues.change}
        />
        <StatCard
          icon={CalendarDays}
          color="#3b82f6"
          value={stats.bookings.total.toLocaleString("en-US")}
          label="إجمالي الحجوزات"
          change={stats.bookings.change}
        />
        <StatCard
          icon={Wallet}
          color="#22c55e"
          value={money(stats.earnings.total)}
          label="إجمالي الأرباح"
          change={stats.earnings.change}
        />
      </section>

      <section className="ov-grid-main">
        <article className="card ov-panel">
          <header className="ov-panel-head">
            <h3>
              <TrendingUp size={18} aria-hidden="true" /> نمو الأرباح
            </h3>
            <div className="ov-filters">
              {PERIODS.map((p) => (
                <button
                  key={p.days}
                  type="button"
                  className={`ov-pill${days === p.days ? " is-active" : ""}`}
                  onClick={() => setDays(p.days)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </header>

          {hasChartData ? (
            <div className="ov-chart" dir="ltr">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="ovEarnings" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#22c55e"
                        stopOpacity={0.45}
                      />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(128,128,128,0.2)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={56}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#22c55e"
                    strokeWidth={3}
                    fill="url(#ovEarnings)"
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="ov-empty">لا توجد أرباح مسجلة في هذه الفترة.</p>
          )}
        </article>

        <article className="card ov-panel">
          <header className="ov-panel-head">
            <h3>
              <ShieldCheck size={18} aria-hidden="true" /> في انتظار المراجعة
            </h3>
            <Link to="/admin/venues" className="ov-link">
              عرض الكل ←
            </Link>
          </header>

          <p className="ov-pending-count">
            <strong>{pending.count}</strong>
            <span className="ov-muted">ملعب جديد بانتظار موافقتك</span>
          </p>

          {pending.items.length === 0 ? (
            <p className="ov-empty">لا توجد ملاعب في انتظار المراجعة.</p>
          ) : (
            <ul className="ov-list">
              {pending.items.map((venue) => (
                <li key={venue.id}>
                  <Link to="/admin/venues" className="ov-row">
                    <Thumb src={venue.image} alt={venue.name} />
                    <span className="ov-row-text">
                      <strong>{venue.name}</strong>
                      <small className="ov-muted">
                        بواسطة: {venue.ownerName}
                      </small>
                    </span>
                    <small className="ov-muted">
                      {timeAgo(venue.createdAt)}
                    </small>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="ov-grid-bottom">
        <article className="card ov-panel">
          <header className="ov-panel-head">
            <h3>
              <Zap size={18} aria-hidden="true" /> أحدث النشاطات
            </h3>
          </header>
          {activities.length === 0 ? (
            <p className="ov-empty">لا توجد أنشطة بعد.</p>
          ) : (
            <ul className="ov-list">
              {activities.map((activity) => {
                const style = ACTIVITY_STYLES[activity.kind];
                const Icon = style.icon;
                return (
                  <li key={activity.key} className="ov-row">
                    <span
                      className="ov-activity-icon"
                      style={{ color: style.color, borderColor: style.color }}
                    >
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    <span className="ov-row-text">{activity.text}</span>
                    <small className="ov-muted">{timeAgo(activity.at)}</small>
                  </li>
                );
              })}
            </ul>
          )}
        </article>

        <article className="card ov-panel">
          <header className="ov-panel-head">
            <h3>
              <Trophy size={18} aria-hidden="true" /> أكثر الملاعب حجزاً
            </h3>
            <small className="ov-muted">
              {PERIODS.find((p) => p.days === days).long}
            </small>
          </header>
          {topVenues.length === 0 ? (
            <p className="ov-empty">لا توجد حجوزات مؤكدة في هذه الفترة.</p>
          ) : (
            <ol className="ov-list">
              {topVenues.map((venue, index) => (
                <li key={venue.id} className="ov-row">
                  <span className={`ov-rank ov-rank-${index + 1}`}>
                    {index + 1}
                  </span>
                  <Thumb src={venue.image} alt={venue.name} />
                  <span className="ov-row-text">
                    <strong>{venue.name}</strong>
                    <span className="ov-bar" aria-hidden="true">
                      <span style={{ width: `${venue.ratio}%` }} />
                    </span>
                  </span>
                  <strong className="ov-count">{venue.count} حجز</strong>
                </li>
              ))}
            </ol>
          )}
        </article>
      </section>
    </div>
  );
}
