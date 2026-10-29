import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { createBooking, getTakenSlots } from "../../services/bookingsService";
import { getVenueBookingInfo, getVenueById } from "../../services/venuesService";
import { DEPOSIT_PERCENT, PAYMENT_METHODS } from "../../lib/constants";

function toMinutes(value) {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function toTime(value) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function today() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

export default function BookingPage() {
  const { venueId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [venue, setVenue] = useState(null);
  const [workingHours, setWorkingHours] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [date, setDate] = useState(today());
  const [takenSlots, setTakenSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadVenue() {
      try {
        setLoading(true);
        const [venueData, bookingInfo] = await Promise.all([
          getVenueById(venueId),
          getVenueBookingInfo(venueId),
        ]);
        if (active) {
          setVenue(venueData);
          setWorkingHours(bookingInfo.workingHours);
          setPaymentMethods(bookingInfo.paymentMethods);
        }
      } catch (loadError) {
        if (active) setError(loadError.message || "تعذر تحميل بيانات الملعب.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadVenue();
    return () => {
      active = false;
    };
  }, [venueId]);

  useEffect(() => {
    if (!date || !venue) return undefined;
    let active = true;

    async function loadSlots() {
      try {
        setSlotsLoading(true);
        setError("");
        const result = await getTakenSlots(venue.id, date);
        if (active) setTakenSlots(result);
      } catch (loadError) {
        if (active) {
          setTakenSlots([]);
          setError(loadError.message || "تعذر تحميل المواعيد المتاحة.");
        }
      } finally {
        if (active) setSlotsLoading(false);
      }
    }
    loadSlots();
    return () => {
      active = false;
    };
  }, [date, venue]);

  const availableSlots = useMemo(() => {
    if (!date || !venue?.slot_minutes) return [];
    const weekday = new Date(`${date}T12:00:00`).getDay();
    const intervals = workingHours.filter((hours) => hours.day_of_week === weekday);
    const slots = [];

    for (const interval of intervals) {
      const open = toMinutes(interval.open_time);
      const close = toMinutes(interval.close_time);
      for (let start = open; start + venue.slot_minutes <= close; start += venue.slot_minutes) {
        const end = start + venue.slot_minutes;
        const overlaps = takenSlots.some(
          (taken) =>
            start < toMinutes(taken.end_time) &&
            end > toMinutes(taken.start_time),
        );
        if (!overlaps) slots.push({ start: toTime(start), end: toTime(end) });
      }
    }

    return slots;
  }, [date, takenSlots, venue, workingHours]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedSlot) {
      setError("اختار موعدًا متاحًا أولًا.");
      return;
    }
    if (!proofFile) {
      setError("ارفع صورة أو ملف إثبات تحويل العربون.");
      return;
    }
    if (!paymentMethods.length) {
      setError("الملعب لم يضف طرق دفع بعد. تواصل مع صاحب الملعب قبل إرسال طلب الحجز.");
      return;
    }

    setError("");
    setSaving(true);
    try {
      const [startTime, endTime] = selectedSlot.split("|");
      await createBooking({
        venueId: venue.id,
        date,
        startTime,
        endTime,
        userId: user.id,
        proofFile,
      });
      navigate("/my-bookings", { state: { bookingCreated: true } });
    } catch (saveError) {
      setError(
        saveError.code === "23P01"
          ? "الموعد لم يعد متاحًا. حدّث المواعيد واختر موعدًا آخر."
          : saveError.message || "تعذر إنشاء الحجز.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="container" style={{ padding: 24 }}>جاري تحميل بيانات الحجز...</div>;
  if (!venue) {
    return (
      <div className="container" style={{ padding: 24 }}>
        <p>{error || "الملعب غير متاح للحجز."}</p>
        <Link to="/venues">العودة للملاعب</Link>
      </div>
    );
  }

  const selected = availableSlots.find((slot) => `${slot.start}|${slot.end}` === selectedSlot);
  const selectedDuration = selected
    ? toMinutes(selected.end) - toMinutes(selected.start)
    : 0;
  const bookingTotal = selected
    ? (venue.price_per_hour * selectedDuration) / 60
    : 0;
  const depositAmount = (bookingTotal * DEPOSIT_PERCENT) / 100;

  return (
    <section className="container" dir="rtl" style={{ paddingTop: 32, paddingBottom: 48, maxWidth: 760 }}>
      <Link to={`/venues/${venue.id}`} className="btn btn-outline" style={{ color: "var(--green)", borderColor: "var(--green)" }}>
        العودة لتفاصيل الملعب
      </Link>
      <div className="card" style={{ padding: 24, marginTop: 20 }}>
        <h1 style={{ color: "var(--green)" }}>احجز في {venue.name}</h1>
        <p style={{ color: "var(--text-muted)", marginTop: 8 }}>
          حوّل العربون الموضح أدناه إلى حساب الملعب، ثم ارفع إثبات التحويل. يظل الطلب قيد المراجعة حتى يوافق صاحب الملعب.
        </p>

        {paymentMethods.length > 0 && (
          <div style={{ marginTop: 18, padding: 14, borderRadius: 10, background: "var(--bg)" }}>
            <strong>طرق تحويل العربون</strong>
            {paymentMethods.map((method) => (
              <p key={`${method.method}-${method.account}`} style={{ marginTop: 6 }}>
                {PAYMENT_METHODS[method.method] || method.method}: {method.account}
              </p>
            ))}
          </div>
        )}
        {paymentMethods.length === 0 && (
          <p role="alert" style={{ color: "var(--status-cancelled)", marginTop: 16 }}>
            صاحب الملعب لم يضف طرق دفع بعد، لذلك لا يمكن إرسال طلب الحجز الآن.
          </p>
        )}

        {error && <p role="alert" style={{ color: "var(--status-cancelled)", marginTop: 16 }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <label htmlFor="booking-date" style={{ display: "block", marginTop: 24, fontWeight: 700 }}>
            تاريخ الحجز
          </label>
          <input
            id="booking-date"
            type="date"
            min={today()}
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setSelectedSlot("");
            }}
            required
            style={{ display: "block", width: "100%", padding: 12, marginTop: 8, border: "1px solid var(--border)", borderRadius: 10 }}
          />

          <h2 style={{ marginTop: 24, fontSize: 18 }}>المواعيد المتاحة</h2>
          {slotsLoading ? (
            <p style={{ padding: "16px 0" }}>جاري تحميل المواعيد...</p>
          ) : availableSlots.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
              {availableSlots.map((slot) => {
                const value = `${slot.start}|${slot.end}`;
                return (
                  <button
                    key={value}
                    type="button"
                    className={selectedSlot === value ? "btn btn-primary" : "btn btn-outline"}
                    style={selectedSlot !== value ? { color: "var(--green)", borderColor: "var(--green)" } : undefined}
                    aria-pressed={selectedSlot === value}
                    onClick={() => setSelectedSlot(value)}
                  >
                    {slot.start} - {slot.end}
                  </button>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", marginTop: 12 }}>
              لا توجد مواعيد متاحة في هذا اليوم.
            </p>
          )}

          {selected && venue.price_per_hour && (
            <div style={{ marginTop: 18, padding: 16, borderRadius: 10, background: "var(--cream)" }}>
              <p>مدة الحجز: {selectedDuration} دقيقة</p>
              <p style={{ marginTop: 6 }}>إجمالي الحجز: {bookingTotal.toFixed(2)} جنيه</p>
              <p style={{ marginTop: 6, color: "var(--green)", fontWeight: 800 }}>
                العربون المطلوب ({DEPOSIT_PERCENT}%): {depositAmount.toFixed(2)} جنيه
              </p>
            </div>
          )}

          <label htmlFor="payment-proof" style={{ display: "block", marginTop: 20, fontWeight: 700 }}>
            {selected
              ? `ارفع إثبات تحويل ${depositAmount.toFixed(2)} جنيه`
              : "ارفع إثبات تحويل العربون بعد اختيار موعد"}
            {" "}(JPG أو PNG أو WebP أو PDF، حتى 5MB)
          </label>
          <input
            id="payment-proof"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              if (file && file.size > 5 * 1024 * 1024) {
                setProofFile(null);
                setError("حجم الملف يجب ألا يتجاوز 5MB.");
                event.target.value = "";
                return;
              }
              setProofFile(file);
              setError("");
            }}
            style={{ display: "block", marginTop: 8 }}
          />

          <button type="submit" className="btn btn-primary" disabled={saving || slotsLoading || !selectedSlot || !proofFile || !paymentMethods.length} style={{ marginTop: 24 }}>
            {saving ? "جاري رفع الإثبات وإرسال الحجز..." : "تأكيد الحجز وإرسال الطلب"}
          </button>
        </form>
      </div>
    </section>
  );
}
