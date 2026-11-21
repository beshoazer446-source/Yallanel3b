import { Plus, Trash2 } from "lucide-react";
import { PAYMENT_METHODS } from "../../../lib/constants";
import SectionCard from "../../dashboard/ui/SectionCard";

export default function PaymentMethodsSection({ methods, onChange }) {
  function updateMethod(index, field, value) {
    onChange(
      methods.map((method, i) => (i === index ? { ...method, [field]: value } : method)),
    );
  }

  return (
    <SectionCard
      title="طرق دفع العربون"
      description="الحسابات اللي اللاعب بيحوّل عليها العربون. لازم طريقة واحدة على الأقل لو الملعب ظاهر للاعبين."
    >
      {methods.length === 0 ? (
        <p className="dash-muted">لسه ما أضفتش أي طريقة دفع.</p>
      ) : (
        <div className="court-payments">
          {methods.map((method, index) => (
            <div className="court-payment" key={`${method.id ?? "new"}-${index}`}>
              <select
                className="dash-input"
                aria-label="طريقة الدفع"
                value={method.method}
                onChange={(event) => updateMethod(index, "method", event.target.value)}
              >
                <option value="">اختر طريقة الدفع</option>
                {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                className="dash-input"
                aria-label="رقم الهاتف أو الحساب"
                placeholder="رقم الهاتف أو الحساب"
                value={method.account}
                onChange={(event) => updateMethod(index, "account", event.target.value)}
              />
              <button
                type="button"
                className="court-icon-btn"
                aria-label="حذف طريقة الدفع"
                onClick={() => onChange(methods.filter((_, i) => i !== index))}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <button
          type="button"
          className="dash-btn dash-btn-secondary"
          onClick={() => onChange([...methods, { method: "", account: "" }])}
        >
          <Plus size={16} aria-hidden="true" />
          إضافة طريقة دفع
        </button>
      </div>
    </SectionCard>
  );
}
