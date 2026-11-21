import FormField from "../../dashboard/ui/FormField";
import SectionCard from "../../dashboard/ui/SectionCard";

export default function BasicInfoSection({ fields, onChange }) {
  return (
    <SectionCard
      title="بيانات الملعب"
      description="الاسم والوصف اللي هيظهروا للاعبين."
    >
      <FormField label="اسم الملعب" required>
        <input
          className="dash-input"
          name="name"
          value={fields.name}
          onChange={onChange}
          placeholder="مثال: ملعب الأبطال"
          required
        />
      </FormField>

      <FormField
        label="وصف الملعب"
        hint="مثال: نوع النجيل، الإضاءة، أي حاجة تهم اللاعب."
      >
        <textarea
          className="dash-input"
          name="description"
          value={fields.description}
          onChange={onChange}
          rows={3}
        />
      </FormField>
    </SectionCard>
  );
}
