import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Panel from "../../dashboard/ui/Panel";
import StatusBadge from "../../dashboard/ui/StatusBadge";
import { formatBookingDate, formatMoney, formatTimeRange } from "./overviewStats";

// تبويبين: حجوزات النهارده (بكل الحالات) والقادمة (معلق ومؤكد)
export default function TodayBookings({ todayList, upcomingList, today, showVenue }) {
  const [tab, setTab] = useState("today");
  const list = tab === "today" ? todayList : upcomingList;

  return (
    <Panel
      title="الحجوزات"
      action={
        <Link to="/owner/bookings" className="dash-btn dash-btn-ghost">
          عرض كل الحجوزات
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
      }
    >
      <div className="overview-tabs" role="tablist" aria-label="الحجوزات">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "today"}
          className={`overview-tab${tab === "today" ? " is-active" : ""}`}
          onClick={() => setTab("today")}
        >
          النهارده
          <span className="overview-tab-count">{todayList.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "upcoming"}
          className={`overview-tab${tab === "upcoming" ? " is-active" : ""}`}
          onClick={() => setTab("upcoming")}
        >
          القادمة
          <span className="overview-tab-count">{upcomingList.length}</span>
        </button>
      </div>

      {list.length === 0 ? (
        <p className="overview-empty">
          {tab === "today" ? "مفيش حجوزات النهارده." : "مفيش حجوزات قادمة."}
        </p>
      ) : (
        <ul className="overview-list" role="tabpanel">
          {list.map((booking) => {
            const sub = [
              tab === "upcoming" ? formatBookingDate(booking.date, today) : "",
              showVenue ? booking.venue?.name : "",
            ]
              .filter(Boolean)
              .join(" · ");
            const dim = booking.status === "cancelled" || booking.status === "rejected";

            return (
              <li className={`overview-row${dim ? " is-dim" : ""}`} key={booking.id}>
                <span className="overview-time">
                  {formatTimeRange(booking.start_time, booking.end_time)}
                </span>
                <div className="overview-row-main">
                  <strong>{booking.player?.name || "لاعب"}</strong>
                  {sub ? <span>{sub}</span> : null}
                </div>
                <div className="overview-row-side">
                  <StatusBadge status={booking.status} />
                  <span className="overview-price">{formatMoney(booking.price)} ج.م</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
