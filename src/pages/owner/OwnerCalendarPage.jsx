import { useCallback, useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import arLocale from "@fullcalendar/core/locales/ar";

import { useAuth } from "../../context/useAuth";
import {
  getOwnerBookings,
  getPaymentProofUrl,
  updateBookingStatus,
} from "../../services/bookingsService";
import { PLATFORM_COMMISSION_PERCENT } from "../../lib/constants";
import PageHeader from "../../components/dashboard/ui/PageHeader";
import "./OwnerCalendar.css";

const STATUS_CONFIG = {
  confirmed: { label: "تمت الموافقة", color: "var(--status-confirmed)" },
  pending: { label: "قيد المراجعة", color: "var(--status-pending)" },
  rejected: { label: "مرفوض", color: "var(--status-cancelled)" },
  cancelled: { label: "ملغي", color: "var(--status-cancelled)" },
};

export default function OwnerCalendarPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [proofUrl, setProofUrl] = useState("");
  const [proofLoading, setProofLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBookings = useCallback(async () => {
    if (!user?.id) return;
    setError("");
    const result = await getOwnerBookings(user.id);
    setBookings(result);
  }, [user?.id]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadBookings()
      .catch((err) => {
        if (active) setError(err.message || "تعذر تحميل مواعيد الحجوزات.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadBookings]);

  // استخراج قائمة الملاعب الموجودة في الحجوزات للفلتر
  const venues = useMemo(() => {
    const map = new Map();
    bookings.forEach((b) => {
      const id = String(b.venue_id);
      if (!map.has(id)) {
        map.set(id, b.venue?.name || `الملعب ${id}`);
      }
    });
    return Array.from(map.entries());
  }, [bookings]);

  // تحويل الحجوزات إلى أحداث للتقويم مع تطبيق فلتر الملعب
  const events = useMemo(() => {
    return bookings
      .filter((b) => selectedVenue === "all" || String(b.venue_id) === selectedVenue)
      .map((booking) => {
        const statusInfo = STATUS_CONFIG[booking.status] || {
          label: booking.status,
          color: "var(--green)",
        };
        const venueName = booking.venue?.name || `ملعب ${booking.venue_id}`;
        const startTime = booking.start_time?.slice(0, 5) || "18:00";
        const endTime = booking.end_time?.slice(0, 5) || "19:00";

        return {
          id: String(booking.id),
          title: `${venueName} (${statusInfo.label})`,
          start: `${booking.date}T${startTime}:00`,
          end: `${booking.date}T${endTime}:00`,
          backgroundColor: statusInfo.color,
          borderColor: statusInfo.color,
          textColor: "#FFFFFF",
          extendedProps: { booking },
        };
      });
  }, [bookings, selectedVenue]);

  // فتح نافذة تفاصيل الحجز وجلب رابط إثبات الدفع إن وجد
  async function handleEventClick(info) {
    const booking = info.event.extendedProps.booking;
    setSelectedBooking(booking);
    setProofUrl("");

    if (booking.payment_proof_url) {
      setProofLoading(true);
      try {
        const url = await getPaymentProofUrl(booking.payment_proof_url);
        setProofUrl(url);
      } catch {
        setProofUrl("");
      } finally {
        setProofLoading(false);
      }
    }
  }

  // تأكيد أو رفض الحجز من داخل التقويم
  async function handleStatusChange(bookingId, newStatus) {
    setUpdating(true);
    setError("");
    try {
      await updateBookingStatus(bookingId, newStatus);
      await loadBookings();
      setSelectedBooking(null);
    } catch (err) {
      setError(err.message || "تعذر تحديث حالة الحجز.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <PageHeader
        title="تقويم الحجوزات"
        subtitle="تابع مواعيد الحجوزات وأدرها مباشرة من الجدول"
      />

      {/* شريط الفلتر ودليل الألوان */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--status-confirmed)" }} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>تمت الموافقة</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--status-pending)" }} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>قيد المراجعة</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--status-cancelled)" }} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>مرفوض / ملغي</span>
          </div>
        </div>

        {venues.length > 1 && (
          <select
            value={selectedVenue}
            onChange={(e) => setSelectedVenue(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              fontWeight: 700,
              minWidth: 180,
            }}
          >
            <option value="all">جميع الملاعب</option>
            {venues.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <p role="alert" style={{ color: "var(--status-cancelled)", fontWeight: 700 }}>
          {error}
        </p>
      )}

      <div className="calendar-wrapper">
        {loading ? (
          <p style={{ padding: 24, textAlign: "center" }}>جاري تحميل جدول الحجوزات...</p>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            locale={arLocale}
            direction="rtl"
            headerToolbar={{
              start: "today prev,next",
              center: "title",
              end: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            slotMinTime="18:00:00"
            slotMaxTime="24:00:00"
            slotLabelFormat={{
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }}
            allDaySlot={false}
            height="auto"
            events={events}
            eventClick={handleEventClick}
          />
        )}
      </div>

      {/* نافذة تفاصيل الحجز (Modal) */}
      {selectedBooking && (
        <div
          onClick={() => !updating && setSelectedBooking(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.55)",
            display: "grid",
            placeItems: "center",
            padding: 16,
            zIndex: 1000,
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 440,
              padding: 24,
              display: "grid",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 18, color: "var(--text-strong)" }}>
                {selectedBooking.venue?.name || `الملعب ${selectedBooking.venue_id}`}
              </h2>
              <strong
                style={{
                  color:
                    STATUS_CONFIG[selectedBooking.status]?.color || "var(--text)",
                }}
              >
                {STATUS_CONFIG[selectedBooking.status]?.label || selectedBooking.status}
              </strong>
            </div>

            <p>
              <strong>التاريخ والوقت:</strong> {selectedBooking.date} ·{" "}
              {selectedBooking.start_time?.slice(0, 5)} - {selectedBooking.end_time?.slice(0, 5)}
            </p>

            {selectedBooking.price != null && (
              <p>
                <strong>الإجمالي:</strong> {selectedBooking.price} جنيه
              </p>
            )}

            {selectedBooking.status === "confirmed" && selectedBooking.price != null && (
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                عمولة المنصة ({PLATFORM_COMMISSION_PERCENT}%):{" "}
                {((Number(selectedBooking.price) * PLATFORM_COMMISSION_PERCENT) / 100).toFixed(2)} جنيه
              </p>
            )}

            {selectedBooking.payment_proof_url && (
              <div>
                {proofLoading ? (
                  <span style={{ fontSize: 14, color: "var(--text-muted)" }}>
                    جاري تحميل إثبات الدفع...
                  </span>
                ) : proofUrl ? (
                  <a
                    href={proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "var(--status-confirmed)", fontWeight: 700, textDecoration: "underline" }}
                  >
                    عرض إثبات الدفع
                  </a>
                ) : (
                  <span style={{ fontSize: 14, color: "var(--status-cancelled)" }}>
                    تعذر فتح إثبات الدفع.
                  </span>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              {selectedBooking.status === "pending" && (
                <>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={updating}
                    onClick={() => handleStatusChange(selectedBooking.id, "confirmed")}
                  >
                    تأكيد الحجز
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{
                      color: "var(--status-cancelled)",
                      borderColor: "var(--status-cancelled)",
                    }}
                    disabled={updating}
                    onClick={() => handleStatusChange(selectedBooking.id, "rejected")}
                  >
                    رفض
                  </button>
                </>
              )}
              <button
                type="button"
                className="btn btn-outline"
                style={{
                  color: "var(--text)",
                  borderColor: "var(--border)",
                  marginRight: "auto",
                }}
                disabled={updating}
                onClick={() => setSelectedBooking(null)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}