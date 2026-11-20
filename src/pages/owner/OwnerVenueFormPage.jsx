import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Copy, MapPinned, SavePlus, ClipboardClock } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { PAYMENT_METHODS } from "../../lib/constants";
import { EGYPT_LOCATIONS, GOVERNORATES } from "../../data/egyptLocations";
import MapPickerModal from "../../components/MapPickerModal";
import { X } from "lucide-react";
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

const PITCH_TYPES = [
  { id: "5x5", label: "خماسي (5 × 5)", sub: "10 لاعبين", amenity: "ملعب خماسي (5×5)" },
  { id: "7x7", label: "سباعي (7 × 7)", sub: "14 لاعبًا", amenity: "ملعب سباعي (7×7)" },
  { id: "8x8", label: "ثماني (8 × 8)", sub: "16 لاعبًا", amenity: "ملعب ثماني (8×8)" },
  { id: "11x11", label: "قانوني (11 × 11)", sub: "22 لاعبًا", amenity: "ملعب قانوني (11×11)" },
];

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
  const [pitchType, setPitchType] = useState("5x5");
  const [customArea, setCustomArea] = useState(false);
  const [workingHours, setWorkingHours] = useState(createDefaultHours);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imagesError, setImagesError] = useState("");

  // حالات الخريطة التفاعلية (Leaflet)
  const [isMapOpen, setIsMapOpen] = useState(false);

  // حالات إدارة المسودة (Draft)
  const [draftNotice, setDraftNotice] = useState("");
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const draftKey = `court_booking_draft_${user?.id || "guest"}_${id || "new"}`;

  const imagePreviewUrls = useRef(new Set());

  useEffect(() => () => {
    imagePreviewUrls.current.forEach((src) => URL.revokeObjectURL(src));
    imagePreviewUrls.current.clear();
  }, []);

  // فحص وجود مسودة محفوظة مسبقًا في المتصفح
  useEffect(() => {
    if (loading) return;
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        setHasSavedDraft(true);
      }
    } catch {
      // تجاهل أخطاء التخزين المحلي
    }
  }, [draftKey, loading]);

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
          // استنتاج نوع الملعب من المميزات أو الوصف
          const rawAmenities = Array.isArray(venueData.amenities)
            ? venueData.amenities.join(", ")
            : normalizeText(venueData.amenities);

          let detectedPitch = "5x5";
          if (rawAmenities.includes("7×7") || rawAmenities.includes("سباعي")) {
            detectedPitch = "7x7";
          } else if (rawAmenities.includes("8×8") || rawAmenities.includes("ثماني")) {
            detectedPitch = "8x8";
          } else if (rawAmenities.includes("11×11") || rawAmenities.includes("قانوني")) {
            detectedPitch = "11x11";
          }
          setPitchType(detectedPitch);

          const loadedCity = normalizeText(venueData.city);
          const loadedArea = normalizeText(venueData.area);

          // فحص هل المنطقة تتبع القائمة أم مخصصة
          const cityAreas = EGYPT_LOCATIONS[loadedCity] || [];
          if (loadedArea && !cityAreas.includes(loadedArea)) {
            setCustomArea(true);
          }

          setVenue({
            ...emptyVenue,
            ...venueData,
            name: normalizeText(venueData.name),
            city: loadedCity,
            area: loadedArea,
            address: normalizeText(venueData.address),
            maps_url: normalizeText(venueData.maps_url),
            description: normalizeText(venueData.description),
            amenities: rawAmenities,
          });

          setWorkingHours(
            bookingInfo.workingHours.length
              ? bookingInfo.workingHours.map((hours) => ({
                  ...hours,
                  open_time: normalizeTime(hours.open_time),
                  close_time: normalizeTime(hours.close_time),
                }))
              : createDefaultHours(),
          );

          setPaymentMethods(
            bookingInfo.paymentMethods.map((method) => ({
              ...method,
              method: normalizeText(method.method),
              account: normalizeText(method.account),
            })),
          );
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

  // استعادة المسودة المحفوظة
  function restoreDraft() {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.venue) setVenue(data.venue);
      if (data.pitchType) setPitchType(data.pitchType);
      if (data.workingHours) setWorkingHours(data.workingHours);
      if (data.paymentMethods) setPaymentMethods(data.paymentMethods);
      setHasSavedDraft(false);
      setDraftNotice("تم استعادة المسودة بنجاح!");
      setTimeout(() => setDraftNotice(""), 4000);
    } catch {
      setError("تعذر قراءة المسودة المحفوظة.");
    }
  }

  // حذف المسودة
  function discardDraft() {
    try {
      localStorage.removeItem(draftKey);
      setHasSavedDraft(false);
      setDraftNotice("تم تجاهل المسودة.");
      setTimeout(() => setDraftNotice(""), 3000);
    } catch {
      //
    }
  }

  // حفظ مسودة يدويًا
  function handleSaveDraftManual() {
    try {
      const draftPayload = {
        venue,
        pitchType,
        workingHours,
        paymentMethods,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draftPayload));
      setDraftNotice("تم حفظ المسودة في متصفحك! يمكنك العودة وإكمالها في أي وقت.");
      setTimeout(() => setDraftNotice(""), 5000);
    } catch {
      setError("تعذر حفظ المسودة في الذاكرة المحلية.");
    }
  }

  // نسخ مواعيد يوم محدد لباقي الأسبوع
  function copyDayHoursToAll(sourceDayIndex) {
    const sourcePeriods = workingHours.filter(
      (h) => h.day_of_week === sourceDayIndex && (h.open_time || h.close_time),
    );

    if (sourcePeriods.length === 0) {
      setError(`يوم ${days[sourceDayIndex]} لا يحتوي على أي أوقات عمل لنسخها.`);
      return;
    }

    setError("");
    setWorkingHours(() => {
      const newHours = [];
      days.forEach((_, targetDayIndex) => {
        sourcePeriods.forEach((period) => {
          newHours.push({
            day_of_week: targetDayIndex,
            open_time: period.open_time,
            close_time: period.close_time,
          });
        });
      });
      return newHours;
    });

    setDraftNotice(`تم نسخ مواعيد يوم ${days[sourceDayIndex]} لجميع أيام الأسبوع!`);
    setTimeout(() => setDraftNotice(""), 4000);
  }

  function changeField(event) {
    const { name, value, type, checked } = event.target;
    setVenue((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  // عند تغيير المحافظة
  function handleCityChange(event) {
    const newCity = event.target.value;
    setVenue((current) => ({
      ...current,
      city: newCity,
      area: "", // إعادة تعيين المنطقة عند تغيير المحافظة
    }));
    setCustomArea(false);
  }

  // عند تغيير المنطقة
  function handleAreaChange(event) {
    const val = event.target.value;
    if (val === "أخرى") {
      setCustomArea(true);
      setVenue((current) => ({ ...current, area: "" }));
    } else {
      setCustomArea(false);
      setVenue((current) => ({ ...current, area: val }));
    }
  }

  function changeHours(index, field, value) {
    setWorkingHours((current) =>
      current.map((hours, rowIndex) => (rowIndex === index ? { ...hours, [field]: value } : hours)),
    );
  }

  function changePaymentMethod(index, field, value) {
    setPaymentMethods((current) =>
      current.map((method, rowIndex) => (rowIndex === index ? { ...method, [field]: value } : method)),
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
    const rawAmenities = normalizeText(venue.amenities);

    if (!name || !address) {
      setError("اسم الملعب والعنوان مطلوبان.");
      return;
    }
    if (!city) {
      setError("يرجى اختيار المحافظة.");
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
    if (
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isInteger(slotMinutes) ||
      slotMinutes <= 0 ||
      slotMinutes % 15 !== 0
    ) {
      setError("السعر يجب أن يكون أكبر من صفر، ومدة الحجز من مضاعفات 15 دقيقة.");
      return;
    }

    if (
      paymentMethods.some(
        (method) => !normalizeText(method.method) || !normalizeText(method.account).trim(),
      )
    ) {
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

    // دمج نوع الملعب (عدد اللاعبين) تلقائيًا داخل المميزات
    const selectedPitchObj = PITCH_TYPES.find((p) => p.id === pitchType);
    const pitchAmenityText = selectedPitchObj ? selectedPitchObj.amenity : "ملعب خماسي (5×5)";

    const existingAmenitiesList = rawAmenities
      .split(",")
      .map((item) => item.trim())
      .filter((item) => {
        if (!item) return false;
        // إزالة أي تعريف سابق لنوع الملعب لتجنب التكرار
        return (
          !item.includes("5×5") &&
          !item.includes("7×7") &&
          !item.includes("8×8") &&
          !item.includes("11×11") &&
          !item.includes("خماسي") &&
          !item.includes("سباعي") &&
          !item.includes("قانوني")
        );
      });

    const finalAmenities = [pitchAmenityText, ...existingAmenitiesList];

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
          amenities: finalAmenities,
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

      // مسح المسودة بعد نجاح الحفظ
      try {
        localStorage.removeItem(draftKey);
      } catch {
        //
      }

      navigate("/owner/dashboard", { state: { venueSaved: savedVenue.name } });
    } catch (saveError) {
      setError(saveError.message || "تعذر حفظ الملعب.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="container" style={{ padding: 24 }}>جاري تحميل بيانات الملعب...</p>;
  }

  const availableAreas = EGYPT_LOCATIONS[venue.city] || [];

  return (
    <section className="container venue-form-page" dir="rtl" style={{ maxWidth: 840, paddingTop: 32, paddingBottom: 60 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Link to="/owner/dashboard" style={{ color: "var(--text-strong)", fontWeight: 700 }}>
          العودة للوحة التحكم
        </Link>
        <button
          type="button"
          onClick={handleSaveDraftManual}
          className="btn btn-outline"
          style={{ fontSize: 13, borderColor: "var(--yellow)", color: "var(--text-strong)" }}
        >
          <SavePlus /> حفظ كمسودة
        </button>
      </div>

      {/* تنبيه وجود مسودة سابقة */}
      {hasSavedDraft && (
        <div className="venue-draft-banner">
          <div>
            <strong><ClipboardClock /> وجدنا مسودة محفوظة مسبقًا لهذا الملعب على جهازك.</strong>
            <p style={{ marginTop: 2, fontSize: 12 }}>هل تريد استعادة البيانات التي أدخلتها سابقًا؟</p>
          </div>
          <div className="venue-draft-actions">
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: 12, padding: "6px 14px", minHeight: 32 }}
              onClick={restoreDraft}
            >
              استعادة المسودة
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: 12, padding: "6px 14px", minHeight: 32 }}
              onClick={discardDraft}
            >
              تجاهل
            </button>
          </div>
        </div>
      )}

      {/* إشعار رسائل المسودة */}
      {draftNotice && (
        <div className="owner-notice" style={{ marginTop: 14, color: "var(--status-confirmed)", borderColor: "color-mix(in srgb, var(--status-confirmed) 35%, transparent)" }}>
          {draftNotice}
        </div>
      )}

      <div className="card" style={{ padding: 28, marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <h1 style={{ color: "var(--text-strong)", fontSize: 24, fontWeight: 800 }}>
            {isEditing ? "تعديل الملعب" : "إضافة ملعب جديد"}
          </h1>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            الحقول المعلمة بـ <span style={{ color: "red" }}>*</span> مطلوبة
          </span>
        </div>

        {error && <p role="alert" style={{ color: "var(--status-cancelled)", marginTop: 16 }}>{error}</p>}
        {imagesError && <p role="status" style={{ color: "var(--status-pending)", marginTop: 16 }}>{imagesError}</p>}

        <form onSubmit={handleSubmit}>
          {/* محدد عدد اللاعبين (نوع الملعب) */}
          <div className="pitch-selector-wrap">
            <label>حجم الملعب وعدد اللاعبين <span style={{color: "red"}}>*</span></label>
            <div className="pitch-pills">
              {PITCH_TYPES.map((type) => (
                <button
                  type="button"
                  key={type.id}
                  className={`pitch-pill-btn ${pitchType === type.id ? "active" : ""}`}
                  onClick={() => setPitchType(type.id)}
                >
                  <span className="pitch-pill-title">{type.label}</span>
                  <span className="pitch-pill-sub">{type.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 20 }}>
            <Field label={<>اسم الملعب <span style={{color: "red"}}>*</span></>} name="name" value={venue.name} onChange={changeField} required placeholder="مثال: ملعب الأبطال" />

            {/* دروب داون المحافظة الموحدة */}
            <label style={{ display: "block", fontWeight: 700 }}>
              المحافظة <span style={{color: "red"}}>*</span>
              <select
                name="city"
                value={venue.city}
                onChange={handleCityChange}
                style={inputStyle}
                required
              >
                <option value="">اختر المحافظة...</option>
                {GOVERNORATES.map((gov) => (
                  <option key={gov} value={gov}>
                    {gov}
                  </option>
                ))}
              </select>
            </label>

            {/* دروب داون المنطقة التابع للمحافظة */}
            <label style={{ display: "block", fontWeight: 700 }}>
              المنطقة / الحي <span style={{color: "red"}}>*</span>
              {availableAreas.length > 0 && !customArea ? (
                <select
                  name="area"
                  value={venue.area}
                  onChange={handleAreaChange}
                  style={inputStyle}
                  required
                >
                  <option value="">اختر المنطقة...</option>
                  {availableAreas.map((areaName) => (
                    <option key={areaName} value={areaName}>
                      {areaName}
                    </option>
                  ))}
                  <option value="أخرى">منطقة أخرى غير مدرجة...</option>
                </select>
              ) : (
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <input
                    name="area"
                    value={venue.area}
                    onChange={changeField}
                    placeholder="اكتب اسم المنطقة أو المركز"
                    style={{ ...inputStyle, marginTop: 0 }}
                    required
                  />
                  {availableAreas.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCustomArea(false)}
                      className="btn btn-outline"
                      style={{ fontSize: 12, padding: "0 10px", whiteSpace: "nowrap" }}
                    >
                      القائمة
                    </button>
                  )}
                </div>
              )}
            </label>

            <Field label={<>العنوان التفصيلي <span style={{color: "red"}}>*</span></>} name="address" value={venue.address} onChange={changeField} required placeholder="مثال: بجوار مدرسة كذا، متفرع من شارع كذا" />

            {/* حقل رابط الخريطة مع زر تحديد على الخريطة */}
            <div className="map-field-wrap">
              <label style={{ fontWeight: 700 }}>
                موقع الملعب على الخريطة
              </label>
              <div className="map-input-group">
                <input
                  name="maps_url"
                  value={venue.maps_url || ""}
                  onChange={changeField}
                  type="url"
                  placeholder="رابط خرائط جوجل أو حدده من الزر"
                  style={{ ...inputStyle, marginTop: 0 }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <button
                  type="button"
                  className="map-picker-btn"
                  onClick={() => setIsMapOpen(true)}
                >
                  <MapPinned size={20} /> حدد على الخريطة (Leaflet + OpenStreetMap)
                </button>
                {venue.maps_url && (
                  <a
                    href={venue.maps_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 12, color: "var(--text-strong)", fontWeight: 700 }}
                  >
                    معاينة الموقع ↗
                  </a>
                )}
              </div>
            </div>

            <Field label={<>سعر الساعة بالجنيه <span style={{color: "red"}}>*</span></>} name="price_per_hour" value={venue.price_per_hour} onChange={changeField} type="number" min="1" required placeholder="مثال: 450" />
            <Field label={<>مدة الحجز بالدقائق <span style={{color: "red"}}>*</span></>} name="slot_minutes" value={venue.slot_minutes} onChange={changeField} type="number" min="15" step="15" required />
          </div>

          <label htmlFor="venue-description" style={labelStyle}>وصف الملعب</label>
          <textarea
            id="venue-description"
            name="description"
            value={venue.description}
            onChange={changeField}
            rows={3}
            style={inputStyle}
            placeholder="نوع النجيل، الإضاءة، المرافق المتاحة..."
          />

          <label htmlFor="venue-amenities" style={labelStyle}>
            المميزات الإضافية (افصل بينها بفاصلة)
          </label>
          <input
            id="venue-amenities"
            name="amenities"
            value={venue.amenities}
            onChange={changeField}
            style={inputStyle}
            placeholder="مثال: إضاءة ليلية، كافيتريا، غرف تغيير ملابس، مواقف سيارات"
          />

          {/* قسم رفع الصور */}
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
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* مواعيد العمل مع ميزة نسخ لكل الأيام */}
          <div style={{ marginTop: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <h2 style={{ fontSize: 18, color: "var(--text-strong)", fontWeight: 800 }}>مواعيد العمل</h2>
              <div className="copy-hours-toolbar">
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>إجراءات سريعة:</span>
                <button
                  type="button"
                  className="copy-hours-btn"
                  onClick={() => copyDayHoursToAll(0)}
                  title="نسخ مواعيد يوم الأحد لجميع أيام الأسبوع بضغطة واحدة"
                >
                  <Copy size={18}/> تطبيق مواعيد الأحد على كل الأيام
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
              {days.map((dayName, day) => (
                <div key={day} style={{ padding: 14, border: "1px solid var(--border)", borderRadius: 12, background: "var(--bg)" }}>
                  <div className="day-header">
                    <strong>{dayName}</strong>
                    <button
                      type="button"
                      className="day-copy-quick-btn"
                      onClick={() => copyDayHoursToAll(day)}
                      title={`نسخ مواعيد ${dayName} لجميع الأيام`}
                    >
                      <Copy size={18}/> نسخ هذا اليوم لباقي الأسبوع
                    </button>
                  </div>

                  {workingHours.map(
                    (hours, index) =>
                      hours.day_of_week === day && (
                        <div className="working-hours-row" key={`${day}-${index}`}>
                          <label className="working-hours-field">
                            وقت الفتح
                            <input
                              aria-label={`فتح ${dayName}`}
                              type="time"
                              step="60"
                              value={hours.open_time?.slice(0, 5) || ""}
                              onChange={(event) => changeHours(index, "open_time", event.target.value)}
                              style={inputStyle}
                            />
                          </label>
                          <div className="working-hours-field">
                            <label>
                              وقت الإغلاق
                              <input
                                aria-label={`إغلاق ${dayName}`}
                                type="time"
                                step="60"
                                disabled={hours.close_time === "24:00"}
                                value={hours.close_time === "24:00" ? "" : hours.close_time?.slice(0, 5) || ""}
                                onChange={(event) => changeHours(index, "close_time", event.target.value)}
                                style={inputStyle}
                              />
                            </label>
                            <label className="midnight-toggle">
                              <input
                                type="checkbox"
                                checked={hours.close_time === "24:00"}
                                onChange={(event) =>
                                  changeHours(index, "close_time", event.target.checked ? "24:00" : "")
                                }
                              />
                              حتى 12 منتصف الليل
                            </label>
                          </div>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{
                              color: "var(--status-cancelled)",
                              borderColor: "var(--status-cancelled)",
                              padding: "8px 12px",
                            }}
                            onClick={() =>
                              setWorkingHours((current) => current.filter((_, rowIndex) => rowIndex !== index))
                            }
                          >
                            حذف
                          </button>
                        </div>
                      ),
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setWorkingHours((current) => [...current, { day_of_week: day, open_time: "", close_time: "" }])
                    }
                    style={{
                      marginTop: 10,
                      color: "var(--text-strong)",
                      background: "transparent",
                      border: 0,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    + إضافة فترة لهذا اليوم
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* طرق دفع العربون */}
          <h2 style={{ fontSize: 18, marginTop: 28, color: "var(--text-strong)", fontWeight: 800 }}>
            طرق دفع العربون
          </h2>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            {paymentMethods.map((method, index) => (
              <div
                key={`${method.id ?? "new"}-${index}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr auto",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <select
                  aria-label="طريقة الدفع"
                  value={method.method}
                  onChange={(event) => changePaymentMethod(index, "method", event.target.value)}
                  style={inputStyle}
                >
                  <option value="">اختر طريقة الدفع</option>
                  {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  aria-label="رقم أو حساب الدفع"
                  value={method.account}
                  placeholder="رقم الهاتف أو الحساب"
                  onChange={(event) => changePaymentMethod(index, "account", event.target.value)}
                  style={inputStyle}
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{
                    color: "var(--status-cancelled)",
                    borderColor: "var(--status-cancelled)",
                    padding: "8px 12px",
                  }}
                  onClick={() =>
                    setPaymentMethods((current) => current.filter((_, rowIndex) => rowIndex !== index))
                  }
                >
                  حذف
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setPaymentMethods((current) => [...current, { method: "", account: "" }])}
              style={{
                justifySelf: "start",
                color: "var(--text-strong)",
                background: "transparent",
                border: 0,
                fontWeight: 700,
                marginTop: 6,
                cursor: "pointer",
              }}
            >
              + إضافة طريقة دفع
            </button>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 24, fontWeight: 700 }}>
            <input type="checkbox" name="is_active" checked={Boolean(venue.is_active)} onChange={changeField} />
            عرض الملعب للاعبين فور الحفظ
          </label>

          <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ minWidth: 160 }}
            >
              {saving ? "جاري الحفظ..." : "حفظ الملعب"}
            </button>
            <button
              type="button"
              onClick={handleSaveDraftManual}
              className="btn btn-outline"
              style={{ color: "var(--text-strong)", borderColor: "var(--border)", minWidth: 160 }}
            >
              <SavePlus /> حفظ كمسودة
            </button>
          </div>
        </form>
      </div>

      {/* نافذة تحديد الموقع على الخريطة (Leaflet + OpenStreetMap) */}
      <MapPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectLocation={(mapsUrl) => {
          setVenue((current) => ({ ...current, maps_url: mapsUrl }));
        }}
        initialUrl={venue.maps_url}
        city={venue.city}
      />
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

const labelStyle = { display: "block", marginTop: 18, fontWeight: 700 };
const inputStyle = {
  display: "block",
  width: "100%",
  marginTop: 8,
  padding: 11,
  border: "1px solid var(--border)",
  borderRadius: 10,
  background: "var(--input-bg)",
  color: "var(--input-text)",
  fontFamily: "inherit",
};
