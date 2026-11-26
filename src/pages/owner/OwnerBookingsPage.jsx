import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { getOwnerBookings } from "../../services/bookingsService";
import "./OwnerBookingsPage.css";

/* ---------- ثوابت ومساعدات ---------- */

// عربي بس بأرقام إنجليزية (nu-latn)
const LOCALE = "ar-EG";

// يحوّل أي أرقام عربية (٠-٩) لأرقام إنجليزية مهما كان سلوك المتصفح
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
function latin(str) {
  return String(str).replace(/[٠-٩]/g, (d) => AR_DIGITS.indexOf(d)).replace(/٬/g, ",").replace(/٫/g, ".");
}

const STATUS = {
  upcoming: { label: "مؤكد", cls: "ob-badge--upcoming" },
  completed: { label: "مكتمل", cls: "ob-badge--completed" },
  cancelled: { label: "ملغي", cls: "ob-badge--cancelled" },
};

// عدّل القيم دي حسب اللي عندكم فعلاً في عمود refund_status
const REFUND_LABELS = {
  pending: "قيد الاسترداد",
  processing: "قيد الاسترداد",
  completed: "تم الاسترداد",
  refunded: "تم الاسترداد",
  failed: "فشل الاسترداد",
};

const PAYMENT_METHOD_LABELS = {
  card: "بطاقة",
  wallet: "محفظة إلكترونية",
  paymob: "Paymob",
};

function bookingStart(b) {
  return new Date(`${b.date}T${b.start_time}`);
}

function bookingEnd(b) {
  const end = new Date(`${b.date}T${b.end_time}`);
  // حجز بيعدّي منتصف الليل
  if (end <= bookingStart(b)) end.setDate(end.getDate() + 1);
  return end;
}

function getStatusKey(b, now) {
  if (b.status === "cancelled") return "cancelled";
  return bookingEnd(b) < now ? "completed" : "upcoming";
}

function money(value) {
  const n = Number(value) || 0;
  return latin(`${n.toLocaleString(LOCALE, { maximumFractionDigits: 2 })} جنيه`);
}

function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return latin(d.toLocaleDateString(LOCALE, { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
}

function fmtShortDate(value) {
  const d = new Date(`${value}T00:00:00`);
  return latin(d.toLocaleDateString(LOCALE, { day: "numeric", month: "short" }));
}

function fmtTime(t) {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m), 0, 0);
  return latin(d.toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit", hour12: true }));
}

function fmtDateTime(value) {
  if (!value) return "—";
  return latin(new Date(value).toLocaleString(LOCALE, {
    day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit",
  }));
}

function durationText(b) {
  const mins = Math.round((bookingEnd(b) - bookingStart(b)) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h} ساعة و${m} دقيقة`;
  if (h) return h === 1 ? "ساعة" : h === 2 ? "ساعتان" : `${h} ساعات`;
  return `${m} دقيقة`;
}

function localISODate(d = new Date()) {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

function customerName(b) {
  return b.player?.name || "عميل";
}

/* ---------- الصفحة ---------- */

export default function OwnerBookingsPage() {
  const { user } = useAuth();
  const { id: selectedId } = useParams();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ venue: "", status: "", from: "", to: "", q: "" });
  const mounted = useRef(false);

  const load = useCallback(async () => {
    try {
      const result = await getOwnerBookings(user.id);
      if (mounted.current) setBookings(result);
    } catch (e) {
      if (mounted.current) setError(e.message || "تعذر تحميل الحجوزات.");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const now = useMemo(() => new Date(), [bookings]); // eslint-disable-line react-hooks/exhaustive-deps

  const enriched = useMemo(
    () => bookings.map((b) => ({ ...b, statusKey: getStatusKey(b, now) })),
    [bookings, now],
  );

  const venues = useMemo(() => {
    const map = new Map();
    enriched.forEach((b) => b.venue && map.set(String(b.venue_id), b.venue.name));
    return [...map.entries()];
  }, [enriched]);

  const stats = useMemo(() => {
    const today = localISODate();
    const active = enriched.filter((b) => b.statusKey !== "cancelled");
    const upcoming = enriched.filter((b) => b.statusKey === "upcoming");
    return {
      today: active.filter((b) => b.date === today).length,
      upcoming: upcoming.length,
      deposits: active.reduce((s, b) => s + (Number(b.deposit_amount) || 0), 0),
      remaining: upcoming.reduce(
        (s, b) => s + Math.max((Number(b.price) || 0) - (Number(b.deposit_amount) || 0), 0),
        0,
      ),
    };
  }, [enriched]);

  const visible = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const list = enriched.filter((b) => {
      if (filters.venue && String(b.venue_id) !== filters.venue) return false;
      if (filters.status && b.statusKey !== filters.status) return false;
      if (filters.from && b.date < filters.from) return false;
      if (filters.to && b.date > filters.to) return false;
      if (q && !customerName(b).toLowerCase().includes(q)) return false;
      return true;
    });
    // القادمة الأقرب موعداً أولاً، وبعدها الباقي من الأحدث للأقدم
    return list.sort((a, b) => {
      const aUp = a.statusKey === "upcoming";
      const bUp = b.statusKey === "upcoming";
      if (aUp !== bUp) return aUp ? -1 : 1;
      const diff = bookingStart(a) - bookingStart(b);
      return aUp ? diff : -diff;
    });
  }, [enriched, filters]);

  const selected = selectedId ? enriched.find((b) => String(b.id) === String(selectedId)) : null;
  const hasFilters = Object.values(filters).some(Boolean);

  const openBooking = (id) => navigate(`/owner/bookings/${id}`);
  const closeDrawer = useCallback(() => navigate("/owner/bookings"), [navigate]);
  const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  return (
    <section className="container ob" dir="rtl">
      <header className="ob-header">
        <h1>الحجوزات</h1>
        <p>الحجوزات المؤكدة والمكتملة والملغية على ملاعبك.</p>
      </header>

      {error && <p role="alert" className="ob-error">{error}</p>}

      <div className="ob-stats">
        <Stat label="حجوزات اليوم" value={latin(stats.today.toLocaleString(LOCALE))} />
        <Stat label="حجوزات قادمة" value={latin(stats.upcoming.toLocaleString(LOCALE))} />
        <Stat label="العربون المحصّل" value={money(stats.deposits)} />
        <Stat label="يُدفع في الملعب" value={money(stats.remaining)} hint="من الحجوزات القادمة" />
      </div>

      <div className="ob-filters">
        <input
          type="search"
          className="ob-input ob-input--search"
          placeholder="ابحث باسم العميل"
          value={filters.q}
          onChange={setFilter("q")}
          aria-label="بحث باسم العميل"
        />
        {venues.length > 1 && (
          <select className="ob-input" value={filters.venue} onChange={setFilter("venue")} aria-label="الملعب">
            <option value="">كل الملاعب</option>
            {venues.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        )}
        <select className="ob-input" value={filters.status} onChange={setFilter("status")} aria-label="الحالة">
          <option value="">كل الحالات</option>
          <option value="upcoming">مؤكد</option>
          <option value="completed">مكتمل</option>
          <option value="cancelled">ملغي</option>
        </select>
        <label className="ob-date">
          <span>من</span>
          <input type="date" className="ob-input" value={filters.from} onChange={setFilter("from")} />
        </label>
        <label className="ob-date">
          <span>إلى</span>
          <input type="date" className="ob-input" value={filters.to} onChange={setFilter("to")} />
        </label>
        {hasFilters && (
          <button type="button" className="ob-reset" onClick={() => setFilters({ venue: "", status: "", from: "", to: "", q: "" })}>
            مسح الفلاتر
          </button>
        )}
      </div>

      {loading ? (
        <p className="ob-empty">جاري تحميل الحجوزات...</p>
      ) : visible.length === 0 ? (
        <p className="ob-empty">
          {hasFilters ? "لا توجد حجوزات تطابق الفلاتر الحالية." : "لا توجد حجوزات على ملاعبك حتى الآن."}
        </p>
      ) : (
        <>
          {/* جدول (ديسكتوب) */}
          <div className="ob-tablewrap card">
            <table className="ob-table">
              <thead>
                <tr>
                  <th>العميل</th>
                  <th>الملعب</th>
                  <th>الموعد</th>
                  <th>العربون</th>
                  <th>المتبقي</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((b) => (
                  <tr
                    key={b.id}
                    tabIndex={0}
                    className={String(b.id) === String(selectedId) ? "is-active" : ""}
                    onClick={() => openBooking(b.id)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openBooking(b.id))}
                  >
                    <td className="ob-strong">{customerName(b)}</td>
                    <td>{b.venue?.name || "—"}</td>
                    <td>
                      <span className="ob-strong">{fmtShortDate(b.date)}</span>
                      <span className="ob-muted"> · {fmtTime(b.start_time)} - {fmtTime(b.end_time)}</span>
                    </td>
                    <td>{money(b.deposit_amount)}</td>
                    <td>{money(Math.max((Number(b.price) || 0) - (Number(b.deposit_amount) || 0), 0))}</td>
                    <td><Badge statusKey={b.statusKey} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* كروت (موبايل) */}
          <ul className="ob-cards">
            {visible.map((b) => (
              <li key={b.id}>
                <button type="button" className="ob-card card" onClick={() => openBooking(b.id)}>
                  <span className="ob-card__top">
                    <span className="ob-strong">{customerName(b)}</span>
                    <Badge statusKey={b.statusKey} />
                  </span>
                  <span className="ob-muted">{b.venue?.name || "—"}</span>
                  <span>{fmtShortDate(b.date)} · {fmtTime(b.start_time)} - {fmtTime(b.end_time)}</span>
                  <span className="ob-card__money">
                    <span>العربون {money(b.deposit_amount)}</span>
                    <span>المتبقي {money(Math.max((Number(b.price) || 0) - (Number(b.deposit_amount) || 0), 0))}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {selectedId && !loading && (
        <Drawer booking={selected} onClose={closeDrawer} />
      )}
    </section>
  );
}

/* ---------- مكونات صغيرة ---------- */

function Stat({ label, value, hint }) {
  return (
    <div className="ob-stat card">
      <span className="ob-stat__label">{label}</span>
      <strong className="ob-stat__value">{value}</strong>
      {hint && <span className="ob-stat__hint">{hint}</span>}
    </div>
  );
}

function Badge({ statusKey }) {
  const s = STATUS[statusKey];
  return <span className={`ob-badge ${s.cls}`}>{s.label}</span>;
}

function Row({ label, children }) {
  return (
    <div className="ob-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Drawer({ booking, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const b = booking;
  const total = Number(b?.price) || 0;
  const deposit = Number(b?.deposit_amount) || 0;
  const remaining = Math.max(total - deposit, 0);

  return (
    <div className="ob-overlay" onClick={onClose}>
      <aside
        className="ob-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="تفاصيل الحجز"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ob-drawer__head">
          <h2>تفاصيل الحجز</h2>
          <button ref={closeRef} type="button" className="ob-close" onClick={onClose} aria-label="إغلاق">
            ✕
          </button>
        </div>

        {!b ? (
          <p className="ob-empty">الحجز غير موجود أو ليس على أحد ملاعبك.</p>
        ) : (
          <div className="ob-drawer__body">
            <div className="ob-drawer__status">
              <Badge statusKey={b.statusKey} />
              <span className="ob-muted">حجز رقم {String(b.id).slice(0, 8)}</span>
            </div>

            <h3>العميل</h3>
            <dl>
              <Row label="الاسم">{customerName(b)}</Row>
              <Row label="عضو منذ">{b.player?.created_at ? fmtDate(b.player.created_at) : "—"}</Row>
            </dl>

            <h3>الموعد</h3>
            <dl>
              <Row label="الملعب">{b.venue?.name || "—"}</Row>
              <Row label="التاريخ">{fmtDate(b.date)}</Row>
              <Row label="الوقت">{fmtTime(b.start_time)} - {fmtTime(b.end_time)}</Row>
              <Row label="المدة">{durationText(b)}</Row>
            </dl>

            <h3>الدفع</h3>
            <dl>
              <Row label="إجمالي الحجز">{money(total)}</Row>
              <Row label="العربون المدفوع أونلاين">{money(deposit)}</Row>
              <Row label="المتبقي في الملعب"><strong>{money(remaining)}</strong></Row>
              {b.payment_method && (
                <Row label="وسيلة الدفع">{PAYMENT_METHOD_LABELS[b.payment_method] || b.payment_method}</Row>
              )}
              {b.payment_ref && <Row label="رقم العملية (Paymob)"><bdi className="ob-mono">{b.payment_ref}</bdi></Row>}
              <Row label="وقت الحجز والدفع">{fmtDateTime(b.created_at)}</Row>
            </dl>

            {b.statusKey === "cancelled" && (
              <>
                <h3>الإلغاء</h3>
                <dl>
                  <Row label="وقت الإلغاء">{fmtDateTime(b.cancelled_at)}</Row>
                  {b.cancellation_reason && <Row label="السبب">{b.cancellation_reason}</Row>}
                  {b.refund_status && b.refund_status !== "none" && (
                    <Row label="الاسترداد">
                      {REFUND_LABELS[b.refund_status] || b.refund_status}
                      {b.refund_amount ? ` · ${money(b.refund_amount)}` : ""}
                    </Row>
                  )}
                </dl>
              </>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}