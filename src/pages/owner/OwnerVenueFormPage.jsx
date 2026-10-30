import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { PAYMENT_METHODS } from "../../lib/constants";
import {
  getVenueBookingInfo,
  getOwnerVenueById,
  getVenueImages,
  saveVenue,
  saveVenueImages,
  validateVenueImageFiles,
} from "../../services/venuesService";
import "./OwnerVenueFormPage.css";

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

function normalizeTime(time) {
  return typeof time === "string" ? time.slice(0, 5) : "";
}

function normalizeText(value) {
  return typeof value === "string" ? value : "";
}

export default function OwnerVenueFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [venue, setVenue] = useState(emptyVenue);
  const [workingHours, setWorkingHours] = useState(createDefaultHours);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imagesError, setImagesError] = useState("");
  const imagePreviewUrls = useRef(new Set());

  useEffect(() => () => {
    imagePreviewUrls.current.forEach((src) => URL.revokeObjectURL(src));
    imagePreviewUrls.current.clear();
  }, []);

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
            name: normalizeText(venueData.name),
            city: normalizeText(venueData.city),
            area: normalizeText(venueData.area),
            address: normalizeText(venueData.address),
            maps_url: normalizeText(venueData.maps_url),
            description: normalizeText(venueData.description),
            amenities: Array.isArray(venueData.amenities) ? venueData.amenities.join(", ") : "",
          });
          setWorkingHours(bookingInfo.workingHours.length
            ? bookingInfo.workingHours.map((hours) => ({
              ...hours,
              open_time: normalizeTime(hours.open_time),
              close_time: normalizeTime(hours.close_time),
            }))
            : createDefaultHours());
          setPaymentMethods(bookingInfo.paymentMethods.map((method) => ({
            ...method,
            method: normalizeText(method.method),
            account: normalizeText(method.account),
          })));
        }
        try {
          const venueImages = await getVenueImages(id);
          if (active) setExistingImages(venueImages);
        } catch (imageLoadError) {
          if (active) {
            setImagesError(
              `تعذر تحميل صور الملعب، لكن يمكنك تعديل باقي البيانات: ${imageLoadError.message}`,
            );
          }
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
    const name = normalizeText(venue.name).trim();
    const city = normalizeText(venue.city).trim();
    const area = normalizeText(venue.area).trim();
    const address = normalizeText(venue.address).trim();
    const mapsUrl = normalizeText(venue.maps_url).trim();
    const description = normalizeText(venue.description).trim();
    const amenities = normalizeText(venue.amenities);
    if (!name || !address) {
      setError("اسم الملعب والعنوان مطلوبان.");
      return;
    }
    const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
    const normalizedHours = workingHours.map((hours) => ({
      ...hours,
      open_time: normalizeTime(hours.open_time),
      close_time: normalizeTime(hours.close_time),
    }));
    const validPeriods = normalizedHours.every((hours) => {
      if (!hours.open_time && !hours.close_time) return true;
      const closeIsValid = timePattern.test(hours.close_time) || hours.close_time === "24:00";
      return timePattern.test(hours.open_time) && closeIsValid && hours.open_time < hours.close_time;
    });
    const noOverlappingPeriods = days.every((_, day) => {
      const periods = normalizedHours
        .filter((hours) => hours.day_of_week === day && hours.open_time && hours.close_time)
        .sort((first, second) => first.open_time.localeCompare(second.open_time));
      return periods.every((period, index) => index === 0 || periods[index - 1].close_time <= period.open_time);
    });
    if (!validPeriods || !noOverlappingPeriods) {
      setError("أدخل وقت الفتح والإغلاق بشكل صحيح لكل يوم عمل.");
      return;
    }
    if (venue.is_active && !normalizedHours.some((hours) => hours.open_time && hours.close_time)) {
      setError("أضف فترة عمل واحدة على الأقل قبل عرض الملعب للاعبين.");
      return;
    }
    const price = Number(venue.price_per_hour);
    const slotMinutes = Number(venue.slot_minutes);
    if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(slotMinutes) || slotMinutes <= 0 || slotMinutes % 15 !== 0) {
      setError("السعر يجب أن يكون أكبر من صفر، ومدة الحجز من مضاعفات 15 دقيقة.");
      return;
    }
    if (paymentMethods.some((method) => !normalizeText(method.method) || !normalizeText(method.account).trim())) {
      setError("أكمل طريقة الدفع ورقم الحساب أو احذف الصف غير المكتمل.");
      return;
    }
    if (venue.is_active && paymentMethods.length === 0) {
      setError("أضف طريقة دفع واحدة على الأقل قبل عرض الملعب للاعبين.");
      return;
    }
    try {
      validateVenueImageFiles(imagePreviews.map(({ file }) => file));
    } catch (imageError) {
      setError(imageError.message);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const savedVenue = await saveVenue({
        venueId: id,
        ownerId: user.id,
        venue: {
          name,
          city,
          area,
          address,
          maps_url: mapsUrl || null,
          description,
          price_per_hour: price,
          slot_minutes: slotMinutes,
          amenities: amenities.split(",").map((item) => item.trim()).filter(Boolean),
          is_active: venue.is_active,
        },
        workingHours: normalizedHours,
        paymentMethods,
      });
      if (imagePreviews.length) {
        await saveVenueImages({
          venueId: savedVenue.id,
          ownerId: user.id,
          files: imagePreviews.map(({ file }) => file),
        });
      }
      navigate("/owner/dashboard", { state: { venueSaved: savedVenue.name } });
    } catch (saveError) {
      setError(saveError.message || "تعذر حفظ الملعب.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="container" style={{ padding: 24 }}>جاري تحميل بيانات الملعب...</p>;

  return (
    <section className="container venue-form-page" dir="rtl" style={{ maxWidth: 820, paddingTop: 32, paddingBottom: 48 }}>
      <Link to="/owner/dashboard" style={{ color: "var(--green)", fontWeight: 700 }}>العودة للوحة التحكم</Link>
      <div className="card" style={{ padding: 24, marginTop: 16 }}>
        <h1 style={{ color: "var(--green)" }}>{isEditing ? "تعديل الملعب" : "إضافة ملعب"}</h1>
        {error && <p role="alert" style={{ color: "var(--status-cancelled)", marginTop: 16 }}>{error}</p>}
        {imagesError && <p role="status" style={{ color: "var(--status-pending)", marginTop: 16 }}>{imagesError}</p>}
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

          <section className="venue-images-form">
            <h2>صور الملعب</h2>
            <p>ارفع صورًا واضحة للملعب (JPG أو PNG أو WebP، بحد أقصى 5MB للصورة).</p>
            <label className="venue-image-picker">
              <span aria-hidden="true">＋</span>
              <span>اختيار صور من الجهاز</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(event) => {
                  const previews = Array.from(event.target.files ?? []).map((file) => ({
                    file,
                    src: URL.createObjectURL(file),
                  }));
                  previews.forEach(({ src }) => imagePreviewUrls.current.add(src));
                  setImagePreviews((current) => [...current, ...previews]);
                  event.target.value = "";
                }}
              />
            </label>
            {(existingImages.length > 0 || imagePreviews.length > 0) && (
              <div className="venue-image-grid">
                {existingImages.map((image) => (
                  <img key={image.id} src={image.image_url} alt={`صورة ${venue.name}`} />
                ))}
                {imagePreviews.map(({ file, src }, index) => (
                  <div className="venue-image-preview" key={`${file.name}-${index}`}>
                    <img src={src} alt={file.name} />
                    <button
                      type="button"
                      aria-label={`إزالة ${file.name}`}
                      onClick={() => {
                        const previewToRemove = imagePreviews[index];
                        URL.revokeObjectURL(previewToRemove.src);
                        imagePreviewUrls.current.delete(previewToRemove.src);
                        setImagePreviews((current) => current.filter((_, fileIndex) => fileIndex !== index));
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <h2 style={{ fontSize: 18, marginTop: 24 }}>مواعيد العمل</h2>
          <div style={{ display: "grid", gap: 14, marginTop: 10 }}>
            {days.map((dayName, day) => (
              <div key={day} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 10 }}>
                <strong>{dayName}</strong>
                {workingHours.map((hours, index) => hours.day_of_week === day && (
                  <div className="working-hours-row" key={`${day}-${index}`}>
                    <label className="working-hours-field">
                      وقت الفتح
                      <input aria-label={`فتح ${dayName}`} type="time" step="60" value={hours.open_time?.slice(0, 5) || ""} onChange={(event) => changeHours(index, "open_time", event.target.value)} style={inputStyle} />
                    </label>
                    <div className="working-hours-field">
                      <label>
                        وقت الإغلاق
                        <input aria-label={`إغلاق ${dayName}`} type="time" step="60" disabled={hours.close_time === "24:00"} value={hours.close_time === "24:00" ? "" : hours.close_time?.slice(0, 5) || ""} onChange={(event) => changeHours(index, "close_time", event.target.value)} style={inputStyle} />
                      </label>
                      <label className="midnight-toggle">
                        <input
                          type="checkbox"
                          checked={hours.close_time === "24:00"}
                          onChange={(event) => changeHours(index, "close_time", event.target.checked ? "24:00" : "")}
                        />
                        حتى 12 منتصف الليل
                      </label>
                    </div>
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
