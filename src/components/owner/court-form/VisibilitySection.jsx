import SectionCard from "../../dashboard/ui/SectionCard";

export default function VisibilitySection({ isActive, onChange }) {
  return (
    <SectionCard title="الظهور للاعبين">
      <label className="court-visibility">
        <input
          type="checkbox"
          role="switch"
          className="dash-switch"
          checked={isActive}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>
          <strong>عرض الملعب للاعبين</strong>
          <span className="dash-hint">
            لو مفعّل الملعب بيظهر في الموقع ويقدر اللاعبين يحجزوه. لازم يكون فيه
            مواعيد عمل وطريقة دفع.
          </span>
        </span>
      </label>
    </SectionCard>
  );
}
