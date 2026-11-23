import { CircleCheck, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import Panel from "../../dashboard/ui/Panel";
import { formatBookingDate, formatTimeRange } from "./overviewStats";

// حجوزات محتاجة رد + تنبيه الملاعب المخفية
export default function ActionNeeded({ pendingList, pendingCount, hiddenVenues, today, showVenue }) {
  const nothing = pendingCount === 0 && hiddenVenues.length === 0;
  const extra = pendingCount - pendingList.length;

  return (
    <Panel
      title="تحتاج إجراء"
      description={pendingCount > 0 ? `${pendingCount} حجز قيد المراجعة` : undefined}
    >
      {hiddenVenues.length > 0 ? (
        <div className="dash-alert is-warning overview-alert" role="status">
          <TriangleAlert size={18} aria-hidden="true" />
          <span>
            {hiddenVenues.length === 1
              ? `«${hiddenVenues[0].name}» مخفي عن اللاعبين ومش بيستقبل حجوزات.`
              : `${hiddenVenues.length} ملاعب مخفية عن اللاعبين ومش بتستقبل حجوزات.`}
          </span>
          <Link to="/owner/courts" className="dash-btn dash-btn-secondary">
            الملاعب
          </Link>
        </div>
      ) : null}

      {pendingList.length > 0 ? (
        <ul className="overview-list">
          {pendingList.map((booking) => {
            const sub = [formatBookingDate(booking.date, today), showVenue ? booking.venue?.name : ""]
              .filter(Boolean)
              .join(" · ");
            return (
              <li className="overview-row" key={booking.id}>
                <span className="overview-time">
                  {formatTimeRange(booking.start_time, booking.end_time)}
                </span>
                <div className="overview-row-main">
                  <strong>{booking.player?.name || "لاعب"}</strong>
                  <span>{sub}</span>
                </div>
                <Link to="/owner/bookings" className="dash-btn dash-btn-secondary">
                  مراجعة
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}

      {extra > 0 ? (
        <p className="dash-hint">
          وفي {extra} حجوزات تانية قيد المراجعة.{" "}
          <Link to="/owner/bookings" className="court-link">
            شوفها كلها
          </Link>
        </p>
      ) : null}

      {nothing ? (
        <p className="overview-empty overview-ok">
          <CircleCheck size={20} aria-hidden="true" />
          مفيش حاجة محتاجة إجراء دلوقتي.
        </p>
      ) : null}
    </Panel>
  );
}
