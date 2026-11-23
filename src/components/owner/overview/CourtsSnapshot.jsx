import { Link } from "react-router-dom";
import Panel from "../../dashboard/ui/Panel";
import StatusBadge from "../../dashboard/ui/StatusBadge";

// كروت صغيرة للملاعب (بتظهر لو فيه أكتر من ملعب)
export default function CourtsSnapshot({ cards, topVenue }) {
  return (
    <Panel
      title="ملاعبي"
      description={
        topVenue
          ? `الأكتر طلبًا آخر 30 يوم: ${topVenue.name} (${topVenue.count} حجز)`
          : undefined
      }
      action={
        <Link to="/owner/courts" className="dash-btn dash-btn-ghost">
          إدارة الملاعب
        </Link>
      }
    >
      <div className="overview-courts-grid">
        {cards.map(({ venue, todayCount, pendingCount }) => (
          <div className="overview-court" key={venue.id}>
            <div className="overview-court-top">
              <strong>{venue.name}</strong>
              <StatusBadge status={venue.is_active ? "active" : "hidden"} />
            </div>
            <span className="dash-hint">حجوزات النهارده: {todayCount}</span>
            {pendingCount > 0 ? (
              <span className="dash-hint">قيد المراجعة: {pendingCount}</span>
            ) : null}
          </div>
        ))}
      </div>
    </Panel>
  );
}
