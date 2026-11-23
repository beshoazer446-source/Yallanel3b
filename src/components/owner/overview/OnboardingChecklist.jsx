import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import Panel from "../../dashboard/ui/Panel";

// خطوات تشغيل الملعب للأونر الجديد. بتختفي لما كلها تكتمل (من الصفحة).
export default function OnboardingChecklist({ steps }) {
  const doneCount = steps.filter((step) => step.done).length;

  return (
    <Panel
      title="ابدأ تستقبل حجوزات"
      description={`${doneCount} من ${steps.length} خطوات اكتملت`}
    >
      <ol className="overview-steps">
        {steps.map((step) => (
          <li className={`overview-step${step.done ? " is-done" : ""}`} key={step.id}>
            <span className="overview-step-mark" aria-hidden="true">
              {step.done ? <Check size={16} /> : null}
            </span>
            <span className="overview-step-label">
              {step.label}
              <span className="sr-only">{step.done ? " (تمت)" : " (لسه)"}</span>
            </span>
            {!step.done && step.to ? (
              <Link to={step.to} className="dash-btn dash-btn-primary">
                ابدأ
              </Link>
            ) : null}
            {!step.done && !step.to ? (
              <span className="dash-hint">بعد إضافة الملعب</span>
            ) : null}
          </li>
        ))}
      </ol>
    </Panel>
  );
}
