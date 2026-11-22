import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  ClipboardClock,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import EmptyState from "../../components/dashboard/ui/EmptyState";
import AmenitiesSection from "../../components/owner/court-form/AmenitiesSection";
import BasicInfoSection from "../../components/owner/court-form/BasicInfoSection";
import ImageSection from "../../components/owner/court-form/ImageSection";
import LocationSection from "../../components/owner/court-form/LocationSection";
import PaymentMethodsSection from "../../components/owner/court-form/PaymentMethodsSection";
import PricingSection from "../../components/owner/court-form/PricingSection";
import VisibilitySection from "../../components/owner/court-form/VisibilitySection";
import WorkingHoursSection from "../../components/owner/court-form/WorkingHoursSection";
import {
  EMPTY_FIELDS,
  buildVenuePayload,
  isCustomArea,
  normalizeText,
  parseAmenities,
  validateCourtForm,
} from "../../components/owner/court-form/courtFormUtils";
import useCourtDraft from "../../components/owner/court-form/useCourtDraft";
import {
  createDefaultWeek,
  isUniform,
  normalizeWeek,
  weekFromRows,
  weekToRows,
} from "../../components/owner/court-form/workingHours";
import "../../components/owner/court-form/court-form.css";
import MapPickerModal from "../../components/MapPickerModal";
import { useAuth } from "../../context/useAuth";
import {
  getOwnerVenueById,
  getVenueBookingInfo,
  getVenueImages,
  removeVenueImage,
  replaceVenueImage,
  saveVenue,
  saveVenueImages,
  validateVenueImageFile,
} from "../../services/venuesService";

// بنعمل remount لما الـ id أو الـ location يتغير، فالـ state بيتصفّر لوحده
export default function OwnerCourtFormPage() {
  const { id } = useParams();
  const location = useLocation();
  return (
    <CourtForm
      key={`${id ?? "new"}-${location.key}`}
      id={id}
      initialWarning={location.state?.warning ?? ""}
    />
  );
}

function CourtForm({ id, initialWarning }) {
  const isEditing = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [slotMinutes, setSlotMinutes] = useState(60);
  const [customArea, setCustomArea] = useState(false);
  const [amenities, setAmenities] = useState([]);
  const [week, setWeek] = useState(createDefaultWeek);
  const [uniform, setUniform] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [image, setImage] = useState({
    existing: null,
    file: null,
    previewUrl: "",
    removeExisting: false,
  });
  const [imageError, setImageError] = useState("");

  const [loading, setLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState(initialWarning);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const errorRef = useRef(null);
  const previewUrlRef = useRef("");

  // تنضيف رابط معاينة الصورة لما الصفحة تتقفل
  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  // لما يظهر خطأ نسكرول له
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);

  // تحميل بيانات الملعب (وضع التعديل)
  useEffect(() => {
    if (!isEditing) return undefined;
    let active = true;

    async function loadCourt() {
      try {
        const [venueData, bookingInfo] = await Promise.all([
          getOwnerVenueById(id, user.id),
          getVenueBookingInfo(id),
        ]);
        if (!active) return;
        if (!venueData) {
          setLoadError("الملعب غير موجود أو لا تملك صلاحية تعديله.");
          return;
        }

        const city = normalizeText(venueData.city);
        const area = normalizeText(venueData.area);
        setFields({
          ...EMPTY_FIELDS,
          name: normalizeText(venueData.name),
          city,
          area,
          address: normalizeText(venueData.address),
          maps_url: normalizeText(venueData.maps_url),
          description: normalizeText(venueData.description),
          price_per_hour: venueData.price_per_hour ?? "",
          is_active: Boolean(venueData.is_active),
        });
        setCustomArea(isCustomArea(city, area));
        setSlotMinutes(Number(venueData.slot_minutes) || 60);
        setAmenities(parseAmenities(venueData.amenities));

        const loadedWeek = weekFromRows(bookingInfo.workingHours);
        setWeek(loadedWeek);
        setUniform(isUniform(loadedWeek));

        setPaymentMethods(
          bookingInfo.paymentMethods.map((method) => ({
            ...method,
            method: normalizeText(method.method),
            account: normalizeText(method.account),
          })),
        );

        try {
          const images = await getVenueImages(id);
          if (active) {
            setImage((current) => ({ ...current, existing: images[0] ?? null }));
          }
        } catch (imageLoadError) {
          if (active) {
            setWarning(
              `تعذر تحميل صورة الملعب، لكن تقدر تعدل باقي البيانات: ${imageLoadError.message}`,
            );
          }
        }
      } catch (loadFailure) {
        if (active) setLoadError(loadFailure.message || "تعذر تحميل بيانات الملعب.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCourt();
    return () => {
      active = false;
    };
  }, [id, isEditing, user.id]);

  // ---------- المسودة ----------

  function applyDraft(data) {
    if (data.fields) {
      const restored = { ...EMPTY_FIELDS, ...data.fields };
      setFields(restored);
      setCustomArea(isCustomArea(restored.city, restored.area));
    }
    if (Array.isArray(data.amenities)) setAmenities(parseAmenities(data.amenities));
    const restoredWeek = normalizeWeek(data.week);
    if (restoredWeek) {
      setWeek(restoredWeek);
      setUniform(typeof data.uniform === "boolean" ? data.uniform : isUniform(restoredWeek));
    }
    if (Array.isArray(data.paymentMethods)) setPaymentMethods(data.paymentMethods);
  }

  const draft = useCourtDraft({
    storageKey: `court_form_draft_v2_${user?.id || "guest"}_${id || "new"}`,
    getSnapshot: () => ({ fields, amenities, week, uniform, paymentMethods }),
    applySnapshot: applyDraft,
  });

  // ---------- تغيير الحقول ----------

  function changeField(event) {
    const { name, value } = event.target;
    setFields((current) => ({ ...current, [name]: value }));
  }

  function changeCity(event) {
    setFields((current) => ({ ...current, city: event.target.value, area: "" }));
    setCustomArea(false);
  }

  function changeArea(event) {
    const value = event.target.value;
    if (value === "أخرى") {
      setCustomArea(true);
      setFields((current) => ({ ...current, area: "" }));
    } else {
      setCustomArea(false);
      setFields((current) => ({ ...current, area: value }));
    }
  }

  // ---------- الصورة ----------

  function replacePreview(file) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = file ? URL.createObjectURL(file) : "";
    return previewUrlRef.current;
  }

  async function pickImage(file) {
    setImageError("");
    try {
      await validateVenueImageFile(file);
    } catch (validationError) {
      setImageError(validationError.message);
      return;
    }
    const previewUrl = replacePreview(file);
    setImage((current) => ({ ...current, file, previewUrl, removeExisting: false }));
  }

  function discardNewImage() {
    replacePreview(null);
    setImageError("");
    setImage((current) => ({ ...current, file: null, previewUrl: "" }));
  }

  async function applyImageChanges(venueId) {
    if (image.file) {
      if (image.existing) {
        await replaceVenueImage({
          venueId,
          ownerId: user.id,
          file: image.file,
          existingImage: image.existing,
        });
      } else {
        await saveVenueImages({ venueId, ownerId: user.id, files: [image.file] });
      }
    } else if (image.removeExisting && image.existing) {
      await removeVenueImage(image.existing);
    }
  }

  // ---------- الحفظ ----------

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const validationError = validateCourtForm({ fields, week, paymentMethods });
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const savedVenue = await saveVenue({
        venueId: id,
        ownerId: user.id,
        venue: buildVenuePayload({ fields, amenities, slotMinutes }),
        workingHours: weekToRows(week),
        paymentMethods,
      });

      draft.clearDraft();

      let imageProblem = "";
      try {
        await applyImageChanges(savedVenue.id);
      } catch (imageFailure) {
        imageProblem = imageFailure.message || "حدث خطأ غير معروف.";
      }

      if (imageProblem) {
        // الملعب اتحفظ فعلًا، فنفتح صفحة تعديله بالرسالة بدل ما نكرر الحفظ
        navigate(`/owner/courts/${savedVenue.id}/edit`, {
          replace: true,
          state: { warning: `تم حفظ الملعب، لكن تعذر تحديث الصورة: ${imageProblem}` },
        });
        return;
      }

      navigate("/owner/courts", { state: { venueSaved: savedVenue.name } });
    } catch (saveError) {
      setError(saveError.message || "تعذر حفظ الملعب.");
    } finally {
      setSaving(false);
    }
  }

  // ---------- العرض ----------

  if (loading) return <p className="dash-muted">جاري تحميل بيانات الملعب...</p>;

  if (loadError) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="تعذر فتح الملعب"
        description={loadError}
        action={
          <Link to="/owner/courts" className="dash-btn dash-btn-primary">
            العودة إلى ملاعبي
          </Link>
        }
      />
    );
  }

  return (
    <>
      <form className="court-form" onSubmit={handleSubmit}>
        <Link to="/owner/courts" className="court-form-back">
          <ArrowRight size={16} aria-hidden="true" />
          العودة إلى ملاعبي
        </Link>

        {draft.hasDraft ? (
          <div className="dash-alert is-warning" role="status">
            <ClipboardClock size={18} aria-hidden="true" />
            <span>لقينا مسودة محفوظة لهذا الملعب على جهازك. تحب تستعيدها؟</span>
            <div className="court-draft-actions">
              <button type="button" className="dash-btn dash-btn-primary" onClick={draft.restoreDraft}>
                استعادة
              </button>
              <button type="button" className="dash-btn dash-btn-secondary" onClick={draft.discardDraft}>
                تجاهل
              </button>
            </div>
          </div>
        ) : null}

        {draft.notice ? (
          <div className="dash-alert is-success" role="status">
            <CircleCheck size={18} aria-hidden="true" />
            <span>{draft.notice}</span>
          </div>
        ) : null}

        {warning ? (
          <div className="dash-alert is-warning" role="status">
            <TriangleAlert size={18} aria-hidden="true" />
            <span>{warning}</span>
          </div>
        ) : null}

        {error ? (
          <div className="dash-alert is-danger" role="alert" ref={errorRef}>
            <CircleAlert size={18} aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        <BasicInfoSection fields={fields} onChange={changeField} />

        <LocationSection
          fields={fields}
          customArea={customArea}
          onChange={changeField}
          onCityChange={changeCity}
          onAreaChange={changeArea}
          onUseAreaList={() => setCustomArea(false)}
          onOpenMap={() => setIsMapOpen(true)}
        />

        <ImageSection
          existing={image.existing}
          file={image.file}
          previewUrl={image.previewUrl}
          removed={image.removeExisting}
          error={imageError}
          onPick={pickImage}
          onDiscardNew={discardNewImage}
          onRemoveExisting={() => setImage((current) => ({ ...current, removeExisting: true }))}
          onUndoRemove={() => setImage((current) => ({ ...current, removeExisting: false }))}
        />

        <PricingSection fields={fields} onChange={changeField} />

        <WorkingHoursSection
          week={week}
          onWeekChange={setWeek}
          uniform={uniform}
          onUniformChange={setUniform}
        />

        <PaymentMethodsSection methods={paymentMethods} onChange={setPaymentMethods} />

        <AmenitiesSection amenities={amenities} onChange={setAmenities} />

        <VisibilitySection
          isActive={Boolean(fields.is_active)}
          onChange={(value) => setFields((current) => ({ ...current, is_active: value }))}
        />

        <div className="dash-form-bar">
          <button type="submit" className="dash-btn dash-btn-primary" disabled={saving}>
            {saving ? "جاري الحفظ..." : "حفظ الملعب"}
          </button>
          <button
            type="button"
            className="dash-btn dash-btn-secondary"
            onClick={draft.saveDraft}
            disabled={saving}
          >
            حفظ كمسودة
          </button>
          <Link to="/owner/courts" style={{color: "red"}} className="dash-btn dash-btn-ghost">
            إلغاء
          </Link>
        </div>
      </form>

      {/* خارج الفورم عشان أزرار نافذة الخريطة ما تحفظش الفورم بالغلط */}
      <MapPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectLocation={(mapsUrl) => setFields((current) => ({ ...current, maps_url: mapsUrl }))}
        initialUrl={fields.maps_url}
        city={fields.city}
      />
    </>
  );
}
