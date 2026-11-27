import { CircleAlert, LifeBuoy, Plus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../../components/dashboard/ui/EmptyState";
import PageHeader from "../../components/dashboard/ui/PageHeader";
import Skeleton from "../../components/dashboard/ui/Skeleton";
import SupportShell from "../../components/support/SupportShell";
import TicketList from "../../components/support/TicketList";
import { useAuth } from "../../context/useAuth";
import { getMyTickets, getUnreadCounts } from "../../services/supportService";

const TABS = [
  { id: "all", label: "الكل" },
  { id: "active", label: "نشطة" },
  { id: "done", label: "منتهية" },
];

function matchesTab(ticket, tab) {
  if (tab === "active") return ticket.status === "open" || ticket.status === "pending";
  if (tab === "done") return ticket.status === "resolved" || ticket.status === "closed";
  return true;
}

// قايمة تذاكري. basePath: /owner/support للأونر أو /support للاعب.
export default function SupportListPage({ basePath, variant = "dashboard" }) {
  const { user } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [unreadByTicket, setUnreadByTicket] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const rows = await getMyTickets(user.id);
        const unread = await getUnreadCounts(
          rows.map((ticket) => ticket.id),
          user.id,
        );
        if (!active) return;
        setTickets(rows);
        setUnreadByTicket(unread);
        setError("");
      } catch (loadError) {
        if (active) setError(loadError.message || "تعذر تحميل التذاكر.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [user.id, reloadKey]);

  // لما ترجع للتبويب نحدّث بصمت (عشان ردود الدعم الجديدة تبان)
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") setReloadKey((current) => current + 1);
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  function refresh() {
    setLoading(true);
    setReloadKey((current) => current + 1);
  }

  const filtered = tickets.filter((ticket) => matchesTab(ticket, tab));
  const totalUnread = Object.values(unreadByTicket).reduce((sum, count) => sum + count, 0);

  const newTicketButton = (
    <Link to={`${basePath}/new`} className="dash-btn dash-btn-primary">
      <Plus size={18} aria-hidden="true" />
      تذكرة جديدة
    </Link>
  );

  let content;
  if (loading) {
    content = (
      <div className="support-list" aria-busy="true" aria-label="جاري تحميل التذاكر">
        {[0, 1, 2].map((item) => (
          <div className="support-row" key={item}>
            <div className="support-row-main">
              <Skeleton height={18} width="55%" />
              <Skeleton height={14} width="35%" />
            </div>
            <Skeleton height={26} width={90} />
          </div>
        ))}
      </div>
    );
  } else if (error) {
    content = (
      <div className="dash-alert is-danger" role="alert">
        <CircleAlert size={18} aria-hidden="true" />
        <span>{error}</span>
        <button type="button" className="dash-btn dash-btn-secondary" onClick={refresh}>
          إعادة المحاولة
        </button>
      </div>
    );
  } else if (tickets.length === 0) {
    content = (
      <EmptyState
        icon={LifeBuoy}
        title="مفيش تذاكر دعم لسه"
        description="لو عندك مشكلة أو استفسار، افتح تذكرة وفريق الدعم هيرد عليك."
        action={newTicketButton}
      />
    );
  } else {
    content = (
      <>
        <div className="support-tabs" role="tablist" aria-label="تصفية التذاكر">
          {TABS.map((item) => (
            <button
              type="button"
              key={item.id}
              role="tab"
              aria-selected={tab === item.id}
              className={`support-tab${tab === item.id ? " is-active" : ""}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
              <span className="support-tab-count">
                {tickets.filter((ticket) => matchesTab(ticket, item.id)).length}
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="overview-empty">مفيش تذاكر في التبويب ده.</p>
        ) : (
          <TicketList tickets={filtered} unreadByTicket={unreadByTicket} basePath={basePath} />
        )}
      </>
    );
  }

  return (
    <SupportShell variant={variant} title="الدعم">
      <PageHeader
        title="تذاكري"
        description={
          !loading && !error && tickets.length > 0
            ? totalUnread > 0
              ? `${tickets.length} تذكرة · ${totalUnread} رسالة جديدة`
              : `${tickets.length} تذكرة`
            : undefined
        }
        action={
          <div className="support-filters">
            <button
              type="button"
              className="dash-btn dash-btn-secondary"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw size={16} aria-hidden="true" />
              تحديث
            </button>
            {tickets.length > 0 ? newTicketButton : null}
          </div>
        }
      />
      {content}
    </SupportShell>
  );
}
