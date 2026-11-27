import { Banknote, Eye, EyeOff, ImageOff, MapPin, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import StatusBadge from "../dashboard/ui/StatusBadge";
import VenueStatusNotice from "./VenueStatusNotice";
// كارت ملعب واحد. featured = الملعب الوحيد فبيتعرض بشكل عريض.
export default function CourtCard({
  court,
  featured = false,
  busy = false,
  onToggleActive,
  onResubmit,
}) {
  const image = court.images?.[0]?.image_url;
  const location = [court.area, court.city].filter(Boolean).join("، ");
  const price = Number(court.price_per_hour);
  // الملعب شغال فعلاً لو معتمد وغير موقوف من الإدارة
  const isLive =
    court.approval_status === "approved" && !court.is_admin_suspended;
  const canResubmit = court.approval_status === "rejected" && onResubmit;

  const className = [
    "dash-court-card",
    featured ? "is-featured" : "",
    court.is_active ? "" : "is-hidden",
  ]
    .filter(Boolean)
    .join(" ");

  let toggleLabel = court.is_active ? "إخفاء" : "إظهار";
  if (busy) toggleLabel = "جاري التحديث...";
  const ToggleIcon = court.is_active ? EyeOff : Eye;

  return (
    <article className={className}>
      <div className="dash-court-media">
        {image ? (
          <img src={image} alt={court.name} loading="lazy" />
        ) : (
          <div className="dash-court-placeholder" aria-hidden="true">
            <ImageOff size={32} />
          </div>
        )}
      </div>

      <div className="dash-court-body">
        <div className="dash-court-top">
          <h3 className="dash-court-name">{court.name}</h3>
          {isLive ? (
            <StatusBadge status={court.is_active ? "active" : "hidden"} />
          ) : (
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color:
                  court.approval_status === "pending_review"
                    ? "#b45309"
                    : "#b91c1c",
              }}
            >
              {court.approval_status === "pending_review"
                ? "قيد المراجعة"
                : court.approval_status === "rejected"
                  ? "مرفوض"
                  : "موقوف من الإدارة"}
            </span>
          )}
        </div>

        <ul className="dash-court-meta">
          {location ? (
            <li>
              <MapPin size={16} aria-hidden="true" />
              <span>{location}</span>
            </li>
          ) : null}
          {Number.isFinite(price) ? (
            <li>
              <Banknote size={16} aria-hidden="true" />
              <span>{price.toLocaleString("en-US")} ج.م / ساعة</span>
            </li>
          ) : null}
        </ul>
        <VenueStatusNotice venue={court} />

        <div className="dash-court-actions">
          <Link
            to={`/owner/courts/${court.id}/edit`}
            className="dash-btn dash-btn-secondary"
          >
            <Pencil size={16} aria-hidden="true" />
            تعديل
          </Link>
          {isLive && (
            <button
              type="button"
              style={{ color: court.is_active ? "red" : "green" }}
              className="dash-btn dash-btn-ghost"
              disabled={busy}
              onClick={() => onToggleActive(court)}
            >
              <ToggleIcon size={16} aria-hidden="true" />
              {toggleLabel}
            </button>
          )}
          {canResubmit && (
            <button
              type="button"
              className="dash-btn dash-btn-primary"
              disabled={busy}
              onClick={() => onResubmit(court)}
            >
              إعادة إرسال للمراجعة
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
