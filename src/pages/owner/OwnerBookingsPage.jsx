import { useEffect, useState } from "react";
import { useAuth } from "../../context/useAuth";
import { getOwnerBookings } from "../../services/bookingsService";

const labels = {
  pending: "في انتظار الدفع",
  confirmed: "مؤكد",
  rejected: "مرفوض",
  cancelled: "ملغي",
};

export default function OwnerBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getOwnerBookings(user.id)
      .then((result) => active && setBookings(result))
      .catch((e) => active && setError(e.message || "تعذر تحميل الحجوزات."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user.id]);

  return (
    <section
      className="container"
      dir="rtl"
      style={{ paddingTop: 32, paddingBottom: 48 }}
    >
      <h1 style={{ color: "var(--green)" }}>الحجوزات</h1>
      {error && (
        <p
          role="alert"
          style={{ color: "var(--status-cancelled)", marginTop: 16 }}
        >
          {error}
        </p>
      )}
      {loading ? (
        <p style={{ padding: 24 }}>جاري تحميل الحجوزات...</p>
      ) : bookings.length === 0 ? (
        <p style={{ marginTop: 20 }}>لا توجد حجوزات لملاعبك حتى الآن.</p>
      ) : (
        <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
          {bookings.map((booking) => (
            <article key={booking.id} className="card" style={{ padding: 20 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <h2 style={{ fontSize: 18 }}>
                  {booking.venue?.name || `الملعب ${booking.venue_id}`}
                </h2>
                <strong
                  style={{
                    color:
                      booking.status === "confirmed"
                        ? "var(--status-confirmed)"
                        : booking.status === "pending"
                          ? "var(--status-pending)"
                          : "var(--status-cancelled)",
                  }}
                >
                  {labels[booking.status] || booking.status}
                </strong>
              </div>
              <p style={{ marginTop: 12 }}>
                {booking.date} · {booking.start_time?.slice(0, 5)} -{" "}
                {booking.end_time?.slice(0, 5)}
              </p>
              {booking.player?.name && (
                <p style={{ marginTop: 6 }}>اللاعب: {booking.player.name}</p>
              )}
              {booking.price != null && (
                <p style={{ marginTop: 6 }}>الإجمالي: {booking.price} جنيه</p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
