import { Link } from "react-router-dom";
import "../../dashboard-ui.css";
import { PriorityBadge, TicketStatusBadge } from "./TicketBadges";
import { REQUESTER_ROLE_LABELS, getCategoryLabel } from "./supportConstants";
import { formatTicketDate } from "./supportUtils";
import "./support.css";

// قايمة تذاكر مشتركة. basePath بيحدد رابط التفاصيل، وshowRequester للأدمن.
export default function TicketList({
  tickets,
  unreadByTicket = {},
  basePath,
  showRequester = false,
}) {
  const now = new Date();

  return (
    <ul className="support-list">
      {tickets.map((ticket) => {
        const unread = unreadByTicket[ticket.id] ?? 0;
        const requesterName = ticket.requester?.name || "صاحب التذكرة";
        const roleLabel = REQUESTER_ROLE_LABELS[ticket.requester_role] ?? ticket.requester_role;

        return (
          <li key={ticket.id}>
            <Link
              to={`${basePath}/${ticket.id}`}
              className={`support-row${unread > 0 ? " is-unread" : ""}`}
            >
              <div className="support-row-main">
                <div className="support-row-title">
                  <strong>{ticket.subject}</strong>
                  {unread > 0 ? (
                    <span className="support-unread" aria-label={`${unread} رسائل غير مقروءة`}>
                      {unread}
                    </span>
                  ) : null}
                </div>
                <p className="support-row-meta">
                  {showRequester ? (
                    <span>
                      {requesterName} ({roleLabel})
                    </span>
                  ) : null}
                  <span>{getCategoryLabel(ticket.category)}</span>
                  <span>آخر تحديث {formatTicketDate(ticket.updated_at, now)}</span>
                </p>
              </div>

              <div className="support-row-side">
                {ticket.priority && ticket.priority !== "normal" ? (
                  <PriorityBadge priority={ticket.priority} />
                ) : null}
                <TicketStatusBadge status={ticket.status} />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
