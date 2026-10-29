import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { getUserBookings } from "../../services/bookingsService";

const statusLabels = {
  pending: "بانتظار موافقة صاحب الملعب",
  confirmed: "تمت الموافقة",
  rejected: "مرفوض",
  cancelled: "ملغي",
};

function statusColor(status) {
  if (status === "confirmed") return "var(--status-confirmed)";
  if (status === "pending") return "var(--status-pending)";
  return "var(--status-cancelled)";
}

export default function MyBookingsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <section className="container" dir="rtl" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ color: "var(--green)" }}>حجوزاتي</h1>
        <button type="button" className="btn btn-outline" style={{ color: "var(--green)", borderColor: "var(--green)" }} onClick={() => loadBookings()}>
          تحديث الحالة
        </button>
      </div>
      {location.state?.bookingCreated && (
        <p role="status" style={{ marginTop: 12, color: "var(--status-confirmed)" }}>
          تم إرسال طلب الحجز بنجاح.
        </p>
      )}
      {loading ? (
        <p style={{ padding: 24 }}>جاري تحميل حجوزاتك...</p>
      ) : error ? (
        <p role="alert" style={{ padding: 24, color: "var(--status-cancelled)" }}>{error}</p>
      ) : bookings.length === 0 ? (
        <div className="card" style={{ padding: 24, marginTop: 20 }}>
          <p>ليس لديك حجوزات حتى الآن.</p>
          <Link to="/venues" className="btn btn-primary" style={{ marginTop: 16 }}>اكتشف الملاعب</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16, marginTop: 20 }}>
          {bookings.map((booking) => (
            <article key={booking.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <h2 style={{ fontSize: 18 }}>
                  {booking.venue?.name || `حجز الملعب رقم ${booking.venue_id}`}
                </h2>
                <strong style={{ color: statusColor(booking.status) }}>
                  {statusLabels[booking.status] || booking.status}
                </strong>
              </div>
              <p style={{ marginTop: 12 }}>
                {booking.date} · {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}
              </p>
              {booking.price != null && <p style={{ marginTop: 6 }}>الإجمالي: {booking.price} جنيه</p>}
              {booking.deposit_amount != null && <p style={{ marginTop: 6 }}>العربون: {booking.deposit_amount} جنيه</p>}
              {booking.venue?.address && (
                <p style={{ color: "var(--text-muted)", marginTop: 6 }}>{booking.venue.address}</p>
              )}
              {booking.venue && (
                <Link to={`/venues/${booking.venue_id}`} style={{ display: "inline-block", marginTop: 12, color: "var(--green)", fontWeight: 700 }}>
                  تفاصيل الملعب
                </Link>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
