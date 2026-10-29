import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { getOwnerBookings } from "../../services/bookingsService";
import { getOwnerVenues } from "../../services/venuesService";
import { PLATFORM_COMMISSION_PERCENT } from "../../lib/constants";

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [venues, setVenues] = useState([]);
  const [bookingCount, setBookingCount] = useState(0);
  const [commissionDue, setCommissionDue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getOwnerVenues(user.id), getOwnerBookings(user.id)])
      .then(([ownedVenues, bookings]) => {
        if (active) {
          setVenues(ownedVenues);
          setBookingCount(bookings.length);
          setCommissionDue(
            bookings
              .filter((booking) => booking.status === "confirmed")
              .reduce(
                (total, booking) =>
                  total +
                  (Number.isFinite(Number(booking.price))
                    ? (Number(booking.price) * PLATFORM_COMMISSION_PERCENT) / 100
                    : 0),
                0,
              ),
          );
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "تعذر تحميل لوحة التحكم.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user.id]);

  return (
    <section className="container" dir="rtl" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <h1 style={{ color: "var(--green)" }}>لوحة صاحب الملعب</h1>
        <Link to="/owner/venues/new" className="btn btn-primary">إضافة ملعب</Link>
      </div>
      {location.state?.venueSaved && <p role="status" style={{ marginTop: 12, color: "var(--status-confirmed)" }}>تم حفظ ملعب {location.state.venueSaved} بنجاح.</p>}
      {loading ? <p style={{ padding: 24 }}>جاري تحميل البيانات...</p> : error ? (
        <p role="alert" style={{ padding: 24, color: "var(--status-cancelled)" }}>{error}</p>
      ) : (
        <>
          <div style={{ display: "flex", gap: 16, marginTop: 20, flexWrap: "wrap" }}>
            <div className="card" style={{ padding: 20, minWidth: 180, flex: 1 }}>
              <p style={{ color: "var(--text-muted)" }}>ملاعبك</p>
              <strong style={{ display: "block", fontSize: 28, color: "var(--green)" }}>{venues.length}</strong>
            </div>
            <div className="card" style={{ padding: 20, minWidth: 180, flex: 1 }}>
              <p style={{ color: "var(--text-muted)" }}>الحجوزات</p>
              <strong style={{ display: "block", fontSize: 28, color: "var(--green)" }}>{bookingCount}</strong>
            </div>
            <div className="card" style={{ padding: 20, minWidth: 180, flex: 1 }}>
              <p style={{ color: "var(--text-muted)" }}>عمولة المنصة المستحقة ({PLATFORM_COMMISSION_PERCENT}%)</p>
              <strong style={{ display: "block", fontSize: 28, color: "var(--green)" }}>{commissionDue.toFixed(2)} ج.م</strong>
              <small style={{ color: "var(--text-muted)" }}>على الحجوزات المؤكدة؛ التحصيل يدوي حاليًا.</small>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32 }}>
            <h2>إدارة الملاعب</h2>
            <Link to="/owner/bookings" style={{ color: "var(--green)", fontWeight: 700 }}>عرض الحجوزات</Link>
          </div>
          {venues.length === 0 ? (
            <p style={{ marginTop: 16 }}>لم تضف ملعبًا بعد.</p>
          ) : (
            <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
              {venues.map((venue) => (
                <article key={venue.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: 20, flexWrap: "wrap" }}>
                  <div>
                    <h3>{venue.name}</h3>
                    <p style={{ color: "var(--text-muted)", marginTop: 6 }}>{venue.address || venue.area || venue.city}</p>
                  </div>
                  <Link to={`/owner/venues/${venue.id}/edit`} className="btn btn-outline" style={{ color: "var(--green)", borderColor: "var(--green)" }}>تعديل البيانات</Link>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
