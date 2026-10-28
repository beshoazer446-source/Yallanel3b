
import { Link } from "react-router-dom";
import { useState } from "react";
import "../owner/OwnerPages.css";

const filters = [
  { value: "all", label: "كل الحجوزات" },
  { value: "pending", label: "معلّقة" },
  { value: "confirmed", label: "مؤكدة" },
  { value: "rejected", label: "مرفوضة" },
];

export default function OwnerBookings() {
  const [filter, setFilter] = useState("all");
  const [bookings, setBookings] = useState([]);

  function updateStatus(id, status) {
    setBookings((current) =>
      current.map((booking) =>
        booking.id === id ? { ...booking, status } : booking,
      ),
    );
  }

  const filteredBookings =
    filter === "all"
      ? bookings
      : bookings.filter((booking) => booking.status === filter);

  return (
    <main className="owner-page">
      <div className="owner-container">
        <header className="owner-header">
          <div className="owner-heading">
            <div className="owner-heading-mark">Y</div>
            <div>
              <h1>إدارة الحجوزات</h1>
              <p>راجع طلبات الحجز وتابع حالة كل طلب.</p>
            </div>
          </div>

          <Link className="owner-btn secondary" to="/owner/dashboard">
            → لوحة التحكم
          </Link>
        </header>

        <div className="owner-notice">
          عرض الحجوزات وتحديث حالتها ببيانات حقيقية يحتاج إلى ربط Supabase.
          الواجهة الحالية لا تحفظ تغييرات في قاعدة البيانات.
        </div>

        <section className="owner-panel">
          <div className="owner-panel-heading">
            <h2>طلبات الحجز</h2>
            <span className="owner-status pending">
              {filteredBookings.length} حجز
            </span>
          </div>

          <div className="owner-filter">
            {filters.map((item) => (
              <button
                key={item.value}
                className={`owner-btn ${
                  filter === item.value ? "" : "secondary"
                }`}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="owner-table-wrap">
            <table className="owner-table">
              <thead>
                <tr>
                  <th>العميل</th>
                  <th>الهاتف</th>
                  <th>الملعب</th>
                  <th>اليوم</th>
                  <th>الوقت</th>
                  <th>العربون</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>

              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.customerName}</td>
                    <td>{booking.phone}</td>
                    <td>{booking.venueName}</td>
                    <td>{booking.day}</td>
                    <td>{booking.time}</td>
                    <td>{booking.deposit} جنيه</td>
                    <td>
                      <span className={`owner-status ${booking.status}`}>
                        {booking.status === "pending"
                          ? "معلّق"
                          : booking.status === "confirmed"
                            ? "مؤكد"
                            : "مرفوض"}
                      </span>
                    </td>
                    <td>
                      {booking.status === "pending" && (
                        <div className="owner-row-actions">
                          <button
                            className="owner-btn"
                            onClick={() =>
                              updateStatus(booking.id, "confirmed")
                            }
                          >
                            تأكيد
                          </button>
                          <button
                            className="owner-btn danger"
                            onClick={() =>
                              updateStatus(booking.id, "rejected")
                            }
                          >
                            رفض
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBookings.length === 0 && (
            <div className="owner-empty">
              لا توجد حجوزات لعرضها حاليًا.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
