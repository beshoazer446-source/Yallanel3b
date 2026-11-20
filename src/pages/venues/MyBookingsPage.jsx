import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CircleCheckBig, Map, MapPinned, RefreshCw, Share2, ShieldLock } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { cancelBooking, getUserBookings } from "../../services/bookingsService";

const statusLabels = {
  pending: "بانتظار التأكيد",
  confirmed: "مؤكد",
  rejected: "مرفوض",
  cancelled: "ملغي",
};

function statusColor(status) {
  if (status === "confirmed") return "var(--status-confirmed)";
  if (status === "pending") return "var(--status-pending)";
  return "var(--status-cancelled)";
}

function formatTime12(timeStr) {
  if (!timeStr) return "";
  const parts = timeStr.slice(0, 5).split(":");
  let hour = parseInt(parts[0], 10);
  const minutes = parts[1] || "00";
  const period = hour >= 12 ? "م" : "ص";
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${minutes} ${period}`;
}

export default function MyBookingsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState("");
  const [filterTab, setFilterTab] = useState("all"); // "all" | "confirmed" | "pending" | "cancelled"

  const loadBookings = useCallback(async () => {
    try {
      const result = await getUserBookings(user.id);
      setBookings(result);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "تعذر تحميل حجوزاتك.");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    const initialLoadId = window.setTimeout(() => void loadBookings(), 0);
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadBookings();
    }, 15000);
    const onFocus = () => void loadBookings();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearTimeout(initialLoadId);
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadBookings]);

  async function handleCancel(bookingId) {
    const confirmed = window.confirm(
      "هل أنت متأكد من رغبتك في إلغاء هذا الحجز؟ سيتم تحديث حالة الحجز للملعب فورًا."
    );
    if (!confirmed) return;

    setCancellingId(bookingId);
    setError("");
    setActionSuccess("");

    try {
      await cancelBooking(bookingId, user.id);
      setActionSuccess("تم إلغاء الحجز بنجاح عبر المنصة.");
      await loadBookings();
    } catch (cancelError) {
      setError(cancelError.message || "تعذر إلغاء الحجز.");
    } finally {
      setCancellingId(null);
    }
  }

  function buildShareText(booking) {
    const venueName = booking.venue?.name || "الملعب";
    const timeFormatted = `${formatTime12(booking.start_time)} إلى ${formatTime12(booking.end_time)}`;
    const remaining =
      booking.price != null && booking.deposit_amount != null
        ? `${booking.price - booking.deposit_amount} جنيه`
        : "";

    return [
      "⚽ ماتشنا القادم يا شباب!",
      `🏟️ الملعب: ${venueName}`,
      `📅 التاريخ: ${booking.date}`,
      `⏰ التوقيت: ${timeFormatted}`,
      remaining ? `💵 المتبقي للدفع في الملعب: ${remaining}` : "",
      booking.venue?.maps_url ? `📍 اللوكيشن: ${booking.venue.maps_url}` : "",
      "الحجز مؤكد وجاهز، متتأخروش! 🔥",
    ]
      .filter(Boolean)
      .join("\n");
  }

  function isMobileDevice() {
    // iPadOS 13+ بيبعت نفسه كـ Mac، فبنفحص الـ touch معاه
    const isIPadOS =
      navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;

    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || isIPadOS;
  }

  async function handleShare(booking) {
    const text = buildShareText(booking);

    // موبايل + المتصفح بيدعم الشير: افتح القائمة الأصلية
    if (isMobileDevice() && navigator.share) {
      try {
        await navigator.share({ title: "تفاصيل الحجز", text });
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
      return;
    }

    // ديسكتوب (أو متصفح مش بيدعم الشير): واتساب مباشرة
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  const filteredBookings = bookings.filter((booking) => {
    if (filterTab === "all") return true;
    if (filterTab === "confirmed") return booking.status === "confirmed";
    if (filterTab === "pending") return booking.status === "pending";
    if (filterTab === "cancelled")
      return booking.status === "cancelled" || booking.status === "rejected";
    return true;
  });

  return (
    <section className="container" dir="rtl" style={{ paddingTop: 32, paddingBottom: 60, maxWidth: 860 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ color: "var(--green)", fontSize: 26, fontWeight: 800 }}>حجوزاتي</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
            متابعة وإدارة مواعيد مبارياتك وإيصالات الحجز
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline"
          style={{ color: "var(--green)", borderColor: "var(--green)", fontSize: 13, padding: "8px 16px" }}
          onClick={() => loadBookings()}
        >
          <RefreshCw size={20} /> تحديث الحالة
        </button>
      </div>

      {/* تنبيه الخصوصية: كل الإجراءات عبر المنصة */}
      <div
        style={{
          marginTop: 16,
          padding: "10px 16px",
          borderRadius: 10,
          background: "var(--cream)",
          border: "1px solid var(--yellow)",
          fontSize: 12,
          color: "var(--green-dark)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ display: "flex", alignItems: "center" }}><ShieldLock size={20} /></span>
        <span>
          <strong>حماية وخصوصية:</strong> جميع عمليات تأكيد الحجز، التعديل، والإلغاء تتم وتُدار آلياً عبر المنصة مباشرة لضمان أمان الطرفين.
        </span>
      </div>

      {location.state?.bookingCreated && (
        <p role="status" style={{ marginTop: 12, color: "var(--status-confirmed)", fontWeight: 700 }}>
          <CircleCheckBig /> تم إرسال طلب الحجز بنجاح ومتاح للمتابعة أدناه.
        </p>
      )}

      {actionSuccess && (
        <p role="status" style={{ marginTop: 12, color: "var(--status-confirmed)", fontWeight: 700 }}>
          <CircleCheckBig /> {actionSuccess}
        </p>
      )}

      {error && (
        <p role="alert" style={{ marginTop: 12, color: "var(--status-cancelled)", fontWeight: 700 }}>
          {error}
        </p>
      )}

      {/* تبويبات الفلترة */}
      {!loading && bookings.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
          {[
            { id: "all", label: `الكل (${bookings.length})` },
            { id: "confirmed", label: `المؤكدة (${bookings.filter((b) => b.status === "confirmed").length})` },
            { id: "pending", label: `قيد التأكيد (${bookings.filter((b) => b.status === "pending").length})` },
            { id: "cancelled", label: `الملغية (${bookings.filter((b) => b.status === "cancelled" || b.status === "rejected").length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              style={{
                border: "none",
                background: filterTab === tab.id ? "var(--green)" : "var(--bg)",
                color: filterTab === tab.id ? "var(--white)" : "var(--text)",
                padding: "8px 16px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
          جاري تحميل حجوزاتك...
        </p>
      ) : bookings.length === 0 ? (
        <div className="card" style={{ padding: 36, marginTop: 20, textAlign: "center", borderRadius: 16 }}>
          <span style={{ fontSize: 40 }}>⚽</span>
          <h2 style={{ fontSize: 18, marginTop: 12, color: "var(--green)" }}>ليس لديك أي حجوزات حتى الآن</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6 }}>
            احجز ملعبك المفضل والعب مع أصحابك في الوقت المناسب لك.
          </p>
          <Link to="/venues" className="btn btn-primary" style={{ marginTop: 18, display: "inline-block" }}>
            اكتشف الملاعب المتاحة
          </Link>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="card" style={{ padding: 28, marginTop: 20, textAlign: "center", borderRadius: 16 }}>
          <p style={{ color: "var(--text-muted)" }}>لا توجد حجوزات في هذا التبويب.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16, marginTop: 18 }}>
          {filteredBookings.map((booking) => {
            const bookingRef = `#BK-${String(booking.id).slice(0, 8).toUpperCase()}`;
            const remainingAmount =
              booking.price != null && booking.deposit_amount != null
                ? booking.price - booking.deposit_amount
                : null;

            return (
              <article
                key={booking.id}
                className="card"
                style={{
                  padding: 24,
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                  boxShadow: "0 4px 18px rgba(7, 28, 22, 0.04)",
                  background: "var(--white)",
                }}
              >
                {/* الرأس: اسم الملعب، كود الحجز، والحالة */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <h2 style={{ fontSize: 18, color: "var(--green)", fontWeight: 800 }}>
                        {booking.venue?.name || `الملعب #${booking.venue_id}`}
                      </h2>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: "var(--bg)",
                          color: "var(--green-dark)",
                          fontFamily: "monospace",
                          direction: "ltr",
                        }}
                      >
                        {bookingRef}
                      </span>
                    </div>
                    {booking.venue?.address && (
                      <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPinned size={16} /> {booking.venue.address}
                      </p>
                    )}
                  </div>

                  <strong
                    style={{
                      color: statusColor(booking.status),
                      background:
                        booking.status === "confirmed"
                          ? "#e4f5eb"
                          : booking.status === "pending"
                            ? "var(--cream)"
                            : "var(--error-bg)",
                      padding: "6px 14px",
                      borderRadius: 999,
                      fontSize: 13,
                    }}
                  >
                    {statusLabels[booking.status] || booking.status}
                  </strong>
                </div>

                {/* تفاصيل الميعاد والأسعار */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 12,
                    marginTop: 16,
                    padding: 14,
                    borderRadius: 12,
                    background: "var(--bg)",
                  }}
                >
                  <div>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", display: "block" }}>تاريخ الماتش</span>
                    <strong style={{ fontSize: 14 }}>{booking.date}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", display: "block" }}>توقيت المباراة</span>
                    <strong style={{ fontSize: 14 }}>
                      {formatTime12(booking.start_time)} - {formatTime12(booking.end_time)}
                    </strong>
                  </div>
                  {booking.price != null && (
                    <div>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", display: "block" }}>السعر الإجمالي</span>
                      <strong style={{ fontSize: 14 }}>{booking.price} جنيه</strong>
                    </div>
                  )}
                  {remainingAmount != null && (
                    <div>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", display: "block" }}>
                        المتبقي للدفع في الملعب
                      </span>
                      <strong style={{ fontSize: 14, color: "var(--green)" }}>
                        {remainingAmount} جنيه
                      </strong>
                    </div>
                  )}
                </div>

                {/* الإجراءات وروابط المشاركة والخريطة */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 10,
                    marginTop: 18,
                    paddingTop: 14,
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {/* شير مع أصحابك على واتساب */}
                    <button
                      onClick={() => handleShare(booking)}
                      className="btn btn-outline"
                      style={{
                        fontSize: 13,
                        padding: "6px 14px",
                        borderColor: "#25D366",
                        color: "#128C7E",
                        fontWeight: 700,
                        gap: 6,
                      }}
                      title="مشاركة تفاصيل الماتش واللوكيشن مع أصحابك على الواتساب"
                    >
                      <Share2 size={20} /> شير تفاصيل الماتش
                    </button>

                    {/* رابط الخريطة المباشر إن وجد */}
                    {booking.venue?.maps_url && (
                      <a
                        href={booking.venue.maps_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline"
                        style={{ fontSize: 13, padding: "6px 14px", color: "var(--green)" }}
                      >
                        <Map size={20} /> الاتجاهات
                      </a>
                    )}

                    <Link
                      to={`/venues/${booking.venue_id}`}
                      style={{
                        fontSize: 13,
                        color: "var(--text-muted)",
                        alignSelf: "center",
                        padding: "6px 8px",
                      }}
                    >
                      تفاصيل الملعب
                    </Link>
                  </div>

                  {/* زر إلغاء الحجز عبر المنصة للحجوزات المعلقة */}
                  {booking.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancellingId === booking.id}
                      className="btn btn-outline"
                      style={{
                        fontSize: 12,
                        padding: "6px 14px",
                        color: "var(--status-cancelled)",
                        borderColor: "var(--status-cancelled)",
                      }}
                    >
                      {cancellingId === booking.id ? "جاري الإلغاء..." : "✕ إلغاء الحجز"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
