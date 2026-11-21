import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/useAuth";
import { getOwnerBookings, getPaymentProofUrl, updateBookingStatus } from "../../services/bookingsService";
import { PLATFORM_COMMISSION_PERCENT } from "../../lib/constants";

const labels = {
  pending: "قيد المراجعة",
  confirmed: "تمت الموافقة",
  rejected: "مرفوض",
  cancelled: "ملغي",
};

export default function OwnerBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [proofLinks, setProofLinks] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const mounted = useRef(false);

  const loadBookings = useCallback(async () => {
    const result = await getOwnerBookings(user.id);
    if (!mounted.current) return;
    setBookings(result);
    const links = await Promise.all(result
      .filter((booking) => booking.payment_proof_url)
      .map(async (booking) => {
        try {
          return [booking.id, { url: await getPaymentProofUrl(booking.payment_proof_url) }];
        } catch (linkError) {
          return [booking.id, { error: linkError.message || "تعذر فتح إثبات الدفع." }];
        }
      }));
    if (mounted.current) setProofLinks(Object.fromEntries(links));
  }, [user.id]);

  useEffect(() => {
    mounted.current = true;
    loadBookings()
      .catch((loadError) => {
        if (mounted.current) setError(loadError.message || "تعذر تحميل الحجوزات.");
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });
    return () => {
      mounted.current = false;
    };
  }, [loadBookings]);

  async function changeStatus(bookingId, status) {
    setUpdatingId(bookingId);
    setError("");
    try {
      await updateBookingStatus(bookingId, status);
      await loadBookings();
    } catch (updateError) {
      setError(updateError.message || "تعذر تحديث حالة الحجز.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section className="container" dir="rtl" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <h1 style={{ color: "var(--green)" }}>إدارة الحجوزات</h1>
      {error && <p role="alert" style={{ color: "var(--status-cancelled)", marginTop: 16 }}>{error}</p>}
      {loading ? <p style={{ padding: 24 }}>جاري تحميل الحجوزات...</p> : bookings.length === 0 ? (
        <p style={{ marginTop: 20 }}>لا توجد حجوزات لملاعبك حتى الآن.</p>
      ) : (
        <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
          {bookings.map((booking) => (
            <article key={booking.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <h2 style={{ fontSize: 18 }}>{booking.venue?.name || `الملعب ${booking.venue_id}`}</h2>
                <strong style={{ color: booking.status === "confirmed" ? "var(--status-confirmed)" : booking.status === "pending" ? "var(--status-pending)" : "var(--status-cancelled)" }}>
                  {labels[booking.status] || booking.status}
                </strong>
              </div>
              <p style={{ marginTop: 12 }}>{booking.date} · {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}</p>
              {booking.price != null && <p style={{ marginTop: 6 }}>الإجمالي: {booking.price} جنيه</p>}
              {booking.status === "confirmed" && booking.price != null && (
                <p style={{ marginTop: 6, color: "var(--text-muted)" }}>
                  عمولة المنصة ({PLATFORM_COMMISSION_PERCENT}% من الإجمالي):{" "}
                  {((Number(booking.price) * PLATFORM_COMMISSION_PERCENT) / 100).toFixed(2)} جنيه — مستحقة للتحصيل اليدوي.
                </p>
              )}
              {booking.payment_proof_url && (
                proofLinks[booking.id]?.url ? (
                  <a href={proofLinks[booking.id].url} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 10, color: "var(--green)", fontWeight: 700 }}>
                    عرض إثبات الدفع
                  </a>
                ) : (
                  <p role="alert" style={{ marginTop: 10, color: "var(--status-cancelled)" }}>
                    {proofLinks[booking.id]?.error || "جاري تحميل إثبات الدفع..."}
                  </p>
                )
              )}
              {booking.status === "pending" && (
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button type="button" className="btn btn-primary" disabled={updatingId === booking.id} onClick={() => changeStatus(booking.id, "confirmed")}>
                    تأكيد الحجز
                  </button>
                  <button type="button" className="btn btn-outline" style={{ color: "var(--status-cancelled)", borderColor: "var(--status-cancelled)" }} disabled={updatingId === booking.id} onClick={() => changeStatus(booking.id, "rejected")}>
                    رفض
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
