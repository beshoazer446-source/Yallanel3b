import { MapPinned } from "lucide-react";
import { EGYPT_LOCATIONS, GOVERNORATES } from "../../../data/egyptLocations";
import FormField from "../../dashboard/ui/FormField";
import SectionCard from "../../dashboard/ui/SectionCard";

export default function LocationSection({
  fields,
  customArea,
  onChange,
  onCityChange,
  onAreaChange,
  onUseAreaList,
  onOpenMap,
}) {
  const availableAreas = EGYPT_LOCATIONS[fields.city] || [];
  const showAreaSelect = availableAreas.length > 0 && !customArea;

  return (
    <SectionCard title="الموقع" description="عشان اللاعبين يوصلوا للملعب بسهولة.">
      <div className="dash-field-grid">
        <FormField label="المحافظة" required>
          <select
            className="dash-input"
            name="city"
            value={fields.city}
            onChange={onCityChange}
            required
          >
            <option value="">اختر المحافظة...</option>
            {GOVERNORATES.map((governorate) => (
              <option key={governorate} value={governorate}>
                {governorate}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="المنطقة / الحي" required>
          {showAreaSelect ? (
            <select
              className="dash-input"
              name="area"
              value={fields.area}
              onChange={onAreaChange}
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
            <div className="court-inline">
              <input
                className="dash-input"
                name="area"
                value={fields.area}
                onChange={onChange}
                placeholder="اكتب اسم المنطقة أو المركز"
                required
              />
              {availableAreas.length > 0 ? (
                <button
                  type="button"
                  className="dash-btn dash-btn-secondary"
                  onClick={onUseAreaList}
                >
                  القائمة
                </button>
              ) : null}
            </div>
          )}
        </FormField>
      </div>

      <FormField
        label="العنوان التفصيلي"
        required
        hint="مثال: بجوار مدرسة كذا، متفرع من شارع كذا."
      >
        <input
          className="dash-input"
          name="address"
          value={fields.address}
          onChange={onChange}
          required
        />
      </FormField>

      <div className="dash-field">
        <span className="dash-label">موقع الملعب على الخريطة</span>
        <div className="court-inline">
          <input
            className="dash-input"
            name="maps_url"
            type="url"
            value={fields.maps_url || ""}
            onChange={onChange}
            placeholder="رابط خرائط جوجل، أو حدده بالزرار"
            aria-label="رابط موقع الملعب على الخريطة"
          />
          <button type="button" className="dash-btn dash-btn-secondary" onClick={onOpenMap}>
            <MapPinned size={16} aria-hidden="true" />
            حدد على الخريطة
          </button>
        </div>
        {fields.maps_url ? (
          <a
            href={fields.maps_url}
            target="_blank"
            rel="noreferrer"
            className="court-link"
          >
            معاينة الموقع ↗
          </a>
        ) : null}
      </div>
    </SectionCard>
  );
}
