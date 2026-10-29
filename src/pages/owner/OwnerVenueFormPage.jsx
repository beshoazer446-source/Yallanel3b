import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { PAYMENT_METHODS } from "../../lib/constants";
import { getVenueBookingInfo, getOwnerVenueById, saveVenue } from "../../services/venuesService";

const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const emptyVenue = {
  name: "",
  city: "",
  area: "",
  address: "",
  maps_url: "",
  description: "",
  price_per_hour: "",
  slot_minutes: 60,
  amenities: "",
  is_active: true,
};

function createDefaultHours() {
  return days.map((_, day_of_week) => ({
    day_of_week,
    open_time: "",
    close_time: "",
  }));
}

export default function OwnerVenueFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [venue, setVenue] = useState(emptyVenue);
  const [workingHours, setWorkingHours] = useState(createDefaultHours);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEditing) return undefined;
    let active = true;

    async function loadVenue() {
      try {
        const [venueData, bookingInfo] = await Promise.all([
          getOwnerVenueById(id, user.id),
          getVenueBookingInfo(id),
        ]);
        if (!venueData) {
          setError("الملعب غير موجود أو لا تملك صلاحية تعديله.");
          return;
        }
        if (active) {
          setVenue({
            ...emptyVenue,
            ...venueData,
            amenities: Array.isArray(venueData.amenities) ? venueData.amenities.join(", ") : "",
          });
          setWorkingHours(bookingInfo.workingHours.length
            ? bookingInfo.workingHours
            : createDefaultHours());
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
  }, [id, isEditing, user.id]);

  function changeField(event) {
    const { name, value, type, checked } = event.target;
    setVenue((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function changeHours(index, field, value) {
    setWorkingHours((current) =>
      current.map((hours, rowIndex) => rowIndex === index ? { ...hours, [field]: value } : hours),
    );
  }

  function changePaymentMethod(index, field, value) {
    setPaymentMethods((current) =>
      current.map((method, rowIndex) => rowIndex === index ? { ...method, [field]: value } : method),
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!venue.name.trim() || !venue.address.trim()) {
      setError("اسم الملعب والعنوان مطلوبان.");
      return;
    }
    const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
    const validPeriods = workingHours.every((hours) => {
      if (!hours.open_time && !hours.close_time) return true;
      const closeIsValid = timePattern.test(hours.close_time) || hours.close_time === "24:00";
      return timePattern.test(hours.open_time) && closeIsValid && hours.open_time < hours.close_time;
    });
    const noOverlappingPeriods = days.every((_, day) => {
      const periods = workingHours
        .filter((hours) => hours.day_of_week === day && hours.open_time && hours.close_time)
        .sort((first, second) => first.open_time.localeCompare(second.open_time));
      return periods.every((period, index) => index === 0 || periods[index - 1].close_time <= period.open_time);
    });
    if (!validPeriods || !noOverlappingPeriods) {
      setError("أدخل وقت الفتح والإغلاق بشكل صحيح لكل يوم عمل.");
      return;
    }
    if (venue.is_active && !workingHours.some((hours) => hours.open_time && hours.close_time)) {
      setError("أضف فترة عمل واحدة على الأقل قبل عرض الملعب للاعبين.");
      return;
    }
    const price = Number(venue.price_per_hour);
    const slotMinutes = Number(venue.slot_minutes);
    if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(slotMinutes) || slotMinutes <= 0 || slotMinutes % 15 !== 0) {
      setError("السعر يجب أن يكون أكبر من صفر، ومدة الحجز من مضاعفات 15 دقيقة.");
      return;
    }
    if (paymentMethods.some((method) => !method.method || !method.account.trim())) {
      setError("أكمل طريقة الدفع ورقم الحساب أو احذف الصف غير المكتمل.");
      return;
    }
    if (venue.is_active && paymentMethods.length === 0) {
      setError("أضف طريقة دفع واحدة على الأقل قبل عرض الملعب للاعبين.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const savedVenue = await saveVenue({
        venueId: id,
        ownerId: user.id,
        venue: {
          name: venue.name.trim(),
          city: venue.city.trim(),
          area: venue.area.trim(),
          address: venue.address.trim(),
          maps_url: venue.maps_url.trim() || null,
          description: venue.description.trim(),
          price_per_hour: price,
          slot_minutes: slotMinutes,
          amenities: venue.amenities.split(",").map((item) => item.trim()).filter(Boolean),
          is_active: venue.is_active,
        },
        workingHours,
        paymentMethods,
      });
      navigate("/owner/dashboard", { state: { venueSaved: savedVenue.name } });
    } catch (saveError) {
      setError(saveError.message || "تعذر حفظ الملعب.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="container" style={{ padding: 24 }}>جاري تحميل بيانات الملعب...</p>;

  return (
    <section className="container" dir="rtl" style={{ maxWidth: 820, paddingTop: 32, paddingBottom: 48 }}>
      <Link to="/owner/dashboard" style={{ color: "var(--green)", fontWeight: 700 }}>العودة للوحة التحكم</Link>
      <div className="card" style={{ padding: 24, marginTop: 16 }}>
        <h1 style={{ color: "var(--green)" }}>{isEditing ? "تعديل الملعب" : "إضافة ملعب"}</h1>
        {error && <p role="alert" style={{ color: "var(--status-cancelled)", marginTop: 16 }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginTop: 20 }}>
            <Field label="اسم الملعب" name="name" value={venue.name} onChange={changeField} required />
            <Field label="المدينة" name="city" value={venue.city} onChange={changeField} />
            <Field label="المنطقة" name="area" value={venue.area} onChange={changeField} />
            <Field label="العنوان" name="address" value={venue.address} onChange={changeField} required />
            <Field label="رابط الخريطة" name="maps_url" value={venue.maps_url || ""} onChange={changeField} type="url" />
            <Field label="سعر الساعة بالجنيه" name="price_per_hour" value={venue.price_per_hour} onChange={changeField} type="number" min="1" required />
            <Field label="مدة الحجز بالدقائق" name="slot_minutes" value={venue.slot_minutes} onChange={changeField} type="number" min="15" step="15" required />
          </div>
          <label htmlFor="venue-description" style={labelStyle}>الوصف</label>
          <textarea id="venue-description" name="description" value={venue.description} onChange={changeField} rows={3} style={inputStyle} />
          <label htmlFor="venue-amenities" style={labelStyle}>المميزات (افصل بينها بفاصلة)</label>
          <input id="venue-amenities" name="amenities" value={venue.amenities} onChange={changeField} style={inputStyle} />

          <h2 style={{ fontSize: 18, marginTop: 24 }}>مواعيد العمل</h2>
          <div style={{ display: "grid", gap: 14, marginTop: 10 }}>
            {days.map((dayName, day) => (
              <div key={day} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 10 }}>
                <strong>{dayName}</strong>
                {workingHours.map((hours, index) => hours.day_of_week === day && (
                  <div key={`${day}-${index}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "center", marginTop: 8 }}>
                    <input aria-label={`فتح ${dayName}`} type="time" value={hours.open_time?.slice(0, 5) || ""} onChange={(event) => changeHours(index, "open_time", event.target.value)} style={inputStyle} />
                    <input aria-label={`إغلاق ${dayName}`} type="text" inputMode="numeric" placeholder="HH:MM أو 24:00" value={hours.close_time?.slice(0, 5) || ""} onChange={(event) => changeHours(index, "close_time", event.target.value)} style={inputStyle} />
                    <button type="button" className="btn btn-outline" style={{ color: "var(--status-cancelled)", borderColor: "var(--status-cancelled)", padding: "8px 12px" }} onClick={() => setWorkingHours((current) => current.filter((_, rowIndex) => rowIndex !== index))}>
                      حذف
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => setWorkingHours((current) => [...current, { day_of_week: day, open_time: "", close_time: "" }])} style={{ marginTop: 8, color: "var(--green)", background: "transparent", border: 0, fontWeight: 700 }}>
                  + إضافة فترة
                </button>
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: 18, marginTop: 24 }}>طرق دفع العربون</h2>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            {paymentMethods.map((method, index) => (
              <div key={`${method.id ?? "new"}-${index}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "center" }}>
                <select aria-label="طريقة الدفع" value={method.method} onChange={(event) => changePaymentMethod(index, "method", event.target.value)} style={inputStyle}>
                  <option value="">اختر طريقة الدفع</option>
                  {Object.entries(PAYMENT_METHODS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <input aria-label="رقم أو حساب الدفع" value={method.account} placeholder="رقم الهاتف أو الحساب" onChange={(event) => changePaymentMethod(index, "account", event.target.value)} style={inputStyle} />
                <button type="button" className="btn btn-outline" style={{ color: "var(--status-cancelled)", borderColor: "var(--status-cancelled)", padding: "8px 12px" }} onClick={() => setPaymentMethods((current) => current.filter((_, rowIndex) => rowIndex !== index))}>
                  حذف
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setPaymentMethods((current) => [...current, { method: "", account: "" }])} style={{ justifySelf: "start", color: "var(--green)", background: "transparent", border: 0, fontWeight: 700 }}>
              + إضافة طريقة دفع
            </button>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20 }}>
            <input type="checkbox" name="is_active" checked={Boolean(venue.is_active)} onChange={changeField} />
            عرض الملعب للاعبين
          </label>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 24 }}>
            {saving ? "جاري الحفظ..." : "حفظ الملعب"}
          </button>
        </form>
      </div>
    </section>
  );
}

function Field({ label, ...props }) {
  return (
    <label style={{ display: "block", fontWeight: 700 }}>
      {label}
      <input {...props} style={inputStyle} />
    </label>
  );
}

const labelStyle = { display: "block", marginTop: 16, fontWeight: 700 };
const inputStyle = {
  display: "block",
  width: "100%",
  marginTop: 8,
  padding: 11,
  border: "1px solid var(--border)",
  borderRadius: 10,
  background: "var(--white)",
  color: "var(--text)",
};
