import { ImagePlus } from "lucide-react";
import { useRef } from "react";
import { VENUE_IMAGE_RULES } from "../../../lib/venueImageRules";
import SectionCard from "../../dashboard/ui/SectionCard";

// صورة واحدة للملعب. التغيير والحذف بيتنفذوا لما المستخدم يدوس "حفظ الملعب".
export default function ImageSection({
  existing,
  file,
  previewUrl,
  removed,
  error,
  onPick,
  onDiscardNew,
  onRemoveExisting,
  onUndoRemove,
}) {
  const inputRef = useRef(null);
  const shownSrc = file ? previewUrl : !removed && existing ? existing.image_url : "";

  function openPicker() {
    inputRef.current?.click();
  }

  function handleChange(event) {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (picked) onPick(picked);
  }

  const { minWidth, minHeight, recommendedLabel } = VENUE_IMAGE_RULES;

  return (
    <SectionCard title="صورة الملعب" description="صورة واحدة واضحة بتظهر للاعبين.">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={handleChange}
      />

      {shownSrc ? (
        <div className="court-image-box">
          <img src={shownSrc} alt="صورة الملعب" />
          <div className="court-image-actions">
            <button type="button" className="dash-btn dash-btn-secondary" onClick={openPicker}>
              تغيير الصورة
            </button>
            {file ? (
              <button type="button" className="dash-btn dash-btn-ghost" onClick={onDiscardNew}>
                إلغاء الصورة الجديدة
              </button>
            ) : (
              <button type="button" className="dash-btn dash-btn-ghost court-danger" onClick={onRemoveExisting}>
                حذف الصورة
              </button>
            )}
          </div>
          {file ? (
            <p className="dash-hint">الصورة الجديدة هتتحفظ لما تدوس «حفظ الملعب».</p>
          ) : null}
        </div>
      ) : removed ? (
        <div className="court-image-empty">
          <p>الصورة هتتحذف لما تدوس «حفظ الملعب».</p>
          <div className="court-image-actions">
            <button type="button" className="dash-btn dash-btn-secondary" onClick={onUndoRemove}>
              تراجع
            </button>
            <button type="button" className="dash-btn dash-btn-ghost" onClick={openPicker}>
              اختيار صورة جديدة
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="court-image-drop" onClick={openPicker}>
          <ImagePlus size={28} aria-hidden="true" />
          <span>اختر صورة للملعب</span>
        </button>
      )}

      <p className="dash-hint">
        الصيغ: JPG أو PNG أو WebP، وحد أقصى 5MB. الأبعاد {minWidth}×{minHeight} فأكبر،
        والصورة أفقية بنسبة قريبة من 16:9 (مثال: {recommendedLabel}).
      </p>
      {error ? (
        <p className="dash-field-error" role="alert">
          {error}
        </p>
      ) : null}
    </SectionCard>
  );
}
