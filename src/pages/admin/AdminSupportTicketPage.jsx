import { ArrowRight, CircleAlert, LifeBuoy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EmptyState from "../../components/dashboard/ui/EmptyState";
import Panel from "../../components/dashboard/ui/Panel";
import Skeleton from "../../components/dashboard/ui/Skeleton";
import AdminTicketControls from "../../components/support/AdminTicketControls";
import { PriorityBadge, TicketStatusBadge } from "../../components/support/TicketBadges";
import TicketChat from "../../components/support/TicketChat";
import { REQUESTER_ROLE_LABELS, getCategoryLabel } from "../../components/support/supportConstants";
import { formatFullDate } from "../../components/support/supportUtils";
import "../../components/support/support.css";
import { useAuth } from "../../context/useAuth";
import usePolling from "../../hooks/usePolling";
import { getTicket } from "../../services/supportService";

export default function AdminSupportTicketPage() {
  const { ticketId } = useParams();
  const { user, profile } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    getTicket(ticketId)
      .then((result) => {
        if (!active) return;
        setTicket(result);
        setError("");
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "تعذر تحميل التذكرة.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [ticketId, reloadKey]);

  // تحديث صامت للحالة (من غير إعادة جلب بيانات صاحب التذكرة)
  const refreshTicket = useCallback(async () => {
    try {
      const fresh = await getTicket(ticketId, { withRequester: false });
      if (fresh) setTicket((current) => (current ? { ...fresh, requester: current.requester } : current));
    } catch {
      // صامت
    }
  }, [ticketId]);

  usePolling(refreshTicket, 12000, Boolean(ticket));

  const backLink = (
    <Link to="/admin/support" className="support-back">
      <ArrowRight size={16} aria-hidden="true" />
      العودة لتذاكر الدعم
    </Link>
  );

  if (loading) {
    return (
      <div className="support-page" aria-busy="true">
        {backLink}
        <Skeleton height={64} />
        <div className="support-layout">
          <Skeleton height={420} />
          <Skeleton height={260} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="support-page">
        {backLink}
        <div className="dash-alert is-danger" role="alert">
          <CircleAlert size={18} aria-hidden="true" />
          <span>{error}</span>
          <button
            type="button"
            className="dash-btn dash-btn-secondary"
            onClick={() => {
              setLoading(true);
              setError("");
              setReloadKey((current) => current + 1);
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="support-page">
        {backLink}
        <EmptyState
          icon={LifeBuoy}
          title="التذكرة غير موجودة"
          description="الرابط ده غلط أو التذكرة اتحذفت."
        />
      </div>
    );
  }

  const requesterName = ticket.requester?.name || "صاحب التذكرة";
  const roleLabel = REQUESTER_ROLE_LABELS[ticket.requester_role] ?? ticket.requester_role;
  const currentUser = { id: user.id, name: profile?.name ?? "", role: profile?.role };

  return (
    <div className="support-page">
      {backLink}

      <div className="support-ticket-head">
        <h2>{ticket.subject}</h2>
        <div className="support-badges">
          <TicketStatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>

      <div className="support-layout">
        <TicketChat
          ticketId={ticket.id}
          currentUser={currentUser}
          ticketStatus={ticket.status}
          peerName={requesterName}
        />

        <aside className="support-aside">
          <AdminTicketControls ticket={ticket} onUpdated={setTicket} />

          <Panel title="تفاصيل التذكرة">
            <dl className="support-details">
              <div>
                <dt>صاحب التذكرة</dt>
                <dd>
                  {requesterName} ({roleLabel})
                </dd>
              </div>
              {ticket.requester?.email ? (
                <div>
                  <dt>البريد الإلكتروني</dt>
                  <dd dir="ltr">{ticket.requester.email}</dd>
                </div>
              ) : null}
              {ticket.requester?.phone ? (
                <div>
                  <dt>رقم الهاتف</dt>
                  <dd dir="ltr">{ticket.requester.phone}</dd>
                </div>
              ) : null}
              <div>
                <dt>التصنيف</dt>
                <dd>{getCategoryLabel(ticket.category)}</dd>
              </div>
              <div>
                <dt>تاريخ الإنشاء</dt>
                <dd>{formatFullDate(ticket.created_at)}</dd>
              </div>
              <div>
                <dt>آخر تحديث</dt>
                <dd>{formatFullDate(ticket.updated_at)}</dd>
              </div>
            </dl>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
