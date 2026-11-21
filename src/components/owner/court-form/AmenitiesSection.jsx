import { Plus, X } from "lucide-react";
import { useState } from "react";
import SectionCard from "../../dashboard/ui/SectionCard";
import { AMENITY_OPTIONS } from "./courtFormUtils";

export default function AmenitiesSection({ amenities, onChange }) {
  const [custom, setCustom] = useState("");
  const customItems = amenities.filter((item) => !AMENITY_OPTIONS.includes(item));

  function toggle(item) {
    onChange(
      amenities.includes(item)
        ? amenities.filter((current) => current !== item)
        : [...amenities, item],
    );
  }

  function addCustom() {
    const value = custom.trim();
    if (!value) return;
    if (!amenities.includes(value)) onChange([...amenities, value]);
    setCustom("");
  }

  return (
    <SectionCard title="المميزات" description="اختار المميزات المتاحة في ملعبك.">
      <div className="dash-chip-group" role="group" aria-label="المميزات">
        {AMENITY_OPTIONS.map((item) => (
          <button
            type="button"
            key={item}
            className={`dash-chip${amenities.includes(item) ? " is-selected" : ""}`}
            aria-pressed={amenities.includes(item)}
            onClick={() => toggle(item)}
          >
            {item}
          </button>
        ))}

        {customItems.map((item) => (
          <button
            type="button"
            key={item}
            className="dash-chip is-selected"
            onClick={() => toggle(item)}
            aria-label={`حذف ${item}`}
          >
            {item}
            <X size={14} aria-hidden="true" />
          </button>
        ))}
      </div>

      <div className="court-inline">
        <input
          className="dash-input"
          aria-label="ميزة أخرى"
          placeholder="ميزة أخرى غير موجودة في القايمة"
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault(); // عشان الـ Enter ما يحفظش الفورم
              addCustom();
            }
          }}
        />
        <button type="button" className="dash-btn dash-btn-secondary" onClick={addCustom}>
          <Plus size={16} aria-hidden="true" />
          إضافة
        </button>
      </div>
    </SectionCard>
  );
}
