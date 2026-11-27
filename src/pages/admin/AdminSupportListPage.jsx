import { ArrowLeft, ArrowRight, CircleAlert, LifeBuoy, RefreshCw, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import EmptyState from "../../components/dashboard/ui/EmptyState";
import PageHeader from "../../components/dashboard/ui/PageHeader";
import Skeleton from "../../components/dashboard/ui/Skeleton";
import { TICKET_CATEGORIES, TICKET_STATUSES } from "../../components/support/supportConstants";
import TicketList from "../../components/support/TicketList";
import "../../components/support/support.css";
import { useAuth } from "../../context/useAuth";
import { getAdminTickets, getUnreadCounts } from "../../services/supportService";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;

export default function AdminSupportListPage() {
  const { user } = useAuth();

  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const [tickets, setTickets] = useState([]);
  const [unreadByTicket, setUnreadByTicket] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const debounceRef = useRef(null);
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  // التحميل: بيتكرر لما الفلاتر أو الصفحة أو reloadKey يتغيروا
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const result = await getAdminTickets({ status, category, search, page, pageSize: PAGE_SIZE });
        const unread = await getUnreadCounts(
          result.tickets.map((ticket) => ticket.id),
          user.id,
        );
        if (!active) return;
        setTickets(result.tickets);
        setTotal(result.total);
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
  }, [status, category, search, page, reloadKey, user.id]);

  // لما ترجع للتبويب نحدّث القايمة بصمت
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") setReloadKey((current) => current + 1);
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  function changeStatus(event) {
    setLoading(true);
    setStatus(event.target.value);
    setPage(0);
  }

  function changeCategory(event) {
    setLoading(true);
    setCategory(event.target.value);
    setPage(0);
  }

  function changeSearch(event) {
    const value = event.target.value;
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      setSearch(value.trim());
      setPage(0);
    }, SEARCH_DEBOUNCE_MS);
  }

  function resetFilters() {
    clearTimeout(debounceRef.current);
    setLoading(true);
    setStatus("all");
    setCategory("all");
    setSearchInput("");
    setSearch("");
    setPage(0);
  }

  function refresh() {
    setLoading(true);
    setReloadKey((current) => current + 1);
  }

  function goToPage(nextPage) {
    setLoading(true);
    setPage(nextPage);
  }

  const hasFilters = status !== "all" || category !== "all" || search !== "";
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  let content;
  if (loading) {
    content = (
      <div className="support-list" aria-busy="true" aria-label="جاري تحميل التذاكر">
        {[0, 1, 2, 3, 4].map((item) => (
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
    content = hasFilters ? (
      <EmptyState
        icon={Search}
        title="مفيش نتائج"
        description="مفيش تذاكر بتطابق الفلاتر دي."
        action={
          <button type="button" className="dash-btn dash-btn-secondary" onClick={resetFilters}>
            مسح الفلاتر
          </button>
        }
      />
    ) : (
      <EmptyState
        icon={LifeBuoy}
        title="مفيش تذاكر لسه"
        description="أي تذكرة دعم بيفتحها أونر أو لاعب هتظهر هنا."
      />
    );
  } else {
    content = (
      <>
        <TicketList
          tickets={tickets}
          unreadByTicket={unreadByTicket}
          basePath="/admin/support"
          showRequester
        />
        {totalPages > 1 ? (
          <nav className="support-pagination" aria-label="الصفحات">
            <button
              type="button"
              className="dash-btn dash-btn-secondary"
              disabled={page === 0}
              onClick={() => goToPage(page - 1)}
            >
              <ArrowRight size={16} aria-hidden="true" />
              السابق
            </button>
            <span>
              صفحة {page + 1} من {totalPages}
            </span>
            <button
              type="button"
              className="dash-btn dash-btn-secondary"
              disabled={page + 1 >= totalPages}
              onClick={() => goToPage(page + 1)}
            >
              التالي
              <ArrowLeft size={16} aria-hidden="true" />
            </button>
          </nav>
        ) : null}
      </>
    );
  }

  return (
    <div className="support-page">
      <PageHeader
        title="تذاكر الدعم"
        description={!loading && !error ? `${total} تذكرة` : undefined}
        action={
          <button type="button" className="dash-btn dash-btn-secondary" onClick={refresh} disabled={loading}>
            <RefreshCw size={16} aria-hidden="true" />
            تحديث
          </button>
        }
      />

      <div className="support-filters">
        <label className="support-search">
          <Search size={16} aria-hidden="true" />
          <input
            className="dash-input"
            type="search"
            value={searchInput}
            onChange={changeSearch}
            placeholder="ابحث بموضوع التذكرة"
            aria-label="بحث بموضوع التذكرة"
          />
        </label>

        <select className="dash-input" value={status} onChange={changeStatus} aria-label="الحالة">
          <option value="all">كل الحالات</option>
          {TICKET_STATUSES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select className="dash-input" value={category} onChange={changeCategory} aria-label="التصنيف">
          <option value="all">كل التصنيفات</option>
          {TICKET_CATEGORIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {hasFilters ? (
          <button type="button" className="dash-btn dash-btn-ghost" onClick={resetFilters}>
            مسح الفلاتر
          </button>
        ) : null}
      </div>

      {content}
    </div>
  );
}
