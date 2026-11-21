import FormField from "../../dashboard/ui/FormField";
import SectionCard from "../../dashboard/ui/SectionCard";

export default function PricingSection({ fields, onChange }) {
  return (
    <SectionCard title="السعر" description="سعر حجز الملعب لمدة ساعة.">
      <FormField label="سعر الساعة" required>
        <div className="dash-input-wrap">
          <input
            className="dash-input has-suffix"
            name="price_per_hour"
            type="number"
            min="1"
            value={fields.price_per_hour}
            onChange={onChange}
            placeholder="مثال: 450"
            required
          />
          <span className="dash-input-suffix">ج.م</span>
        </div>
      </FormField>
    </SectionCard>
  );
}
