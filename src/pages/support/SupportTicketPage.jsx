import { ArrowRight, CircleAlert, CircleCheck, LifeBuoy, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EmptyState from "../../components/dashboard/ui/EmptyState";
import Skeleton from "../../components/dashboard/ui/Skeleton";
import { PriorityBadge, TicketStatusBadge } from "../../components/support/TicketBadges";
import TicketChat from "../../components/support/TicketChat";
import SupportShell from "../../components/support/SupportShell";
import { getCategoryLabel } from "../../components/support/supportConstants";
import { formatFullDate } from "../../components/support/supportUtils";
import { useAuth } from "../../context/useAuth";
import usePolling from "../../hooks/usePolling";
import { getTicket } from "../../services/supportService";

// تفاصيل تذكرة + شات. basePath: /owner/support أو /support
export default function SupportTicketPage({ basePath, variant = "dashboard" }) {
  const { ticketId } = useParams();
  const { user, profile } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    getTicket(ticketId, { withRequester: false })
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

  // لو الأدمن غيّر الحالة بنعرف خلال ثواني
  const refreshTicket = useCallback(async () => {
    try {
      const fresh = await getTicket(ticketId, { withRequester: false });
      if (fresh) setTicket(fresh);
    } catch {
      // صامت
    }
  }, [ticketId]);

  usePolling(refreshTicket, 12000, Boolean(ticket));

  const backLink = (
    <Link to={basePath} className="support-back">
      <ArrowRight size={16} aria-hidden="true" />
      العودة لتذاكري
    </Link>
  );

  let content;
  if (loading) {
    content = (
      <div aria-busy="true">
        <Skeleton height={64} />
        <div style={{ height: 16 }} />
        <Skeleton height={420} />
      </div>
    );
  } else if (error) {
    content = (
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
    );
  } else if (!ticket) {
    content = (
      <EmptyState
        icon={LifeBuoy}
        title="التذكرة غير موجودة"
        description="الرابط ده غلط، أو التذكرة مش بتاعتك."
      />
    );
  } else {
    content = (
      <>
        <div className="support-ticket-head">
          <div>
            <h2>{ticket.subject}</h2>
            <p className="support-meta">
              <span>{getCategoryLabel(ticket.category)}</span>
              <span>اتفتحت {formatFullDate(ticket.created_at)}</span>
            </p>
          </div>
          <div className="support-badges">
            <TicketStatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>

        {ticket.status === "resolved" ? (
          <div className="dash-alert is-success support-flush" role="status">
            <CircleCheck size={18} aria-hidden="true" />
            <span>فريق الدعم علّم التذكرة دي «تم الحل». لو لسه عندك مشكلة ابعت رد وهنتابعها.</span>
          </div>
        ) : null}

        <TicketChat
          ticketId={ticket.id}
          currentUser={{ id: user.id, name: profile?.name ?? "", role: profile?.role }}
          ticketStatus={ticket.status}
          peerName="فريق الدعم"
        />

        {ticket.status === "closed" ? (
          <div>
            <Link to={`${basePath}/new`} className="dash-btn dash-btn-secondary">
              <Plus size={16} aria-hidden="true" />
              افتح تذكرة جديدة
            </Link>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <SupportShell variant={variant} title="الدعم">
      {backLink}
      {content}
    </SupportShell>
  );
}
