import { useState } from "react";
import {
  CURRENCY_LABEL,
  MIN_WITHDRAWAL_CENTS,
  centsToDecimalString,
  formatCents,
  parseAmountToCents,
  toCents,
} from "../../../lib/moneyUtils";
import { getWalletErrorMessage } from "../../../lib/walletErrors";
import { PAYOUT_METHODS, getPayoutMethod } from "../../../lib/walletLabels";
import { requestWithdrawal } from "../../../services/walletService";
import FormField from "../../dashboard/ui/FormField";
import Modal from "../../dashboard/ui/Modal";

function normalizeDigits(text) {
  return text.replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632));
}

// تحقق الواجهة (الـ DB هو اللي بيفصل في الآخر)
function validate({ amount, method, details }, availableCents) {
  const errors = {};

  const cents = parseAmountToCents(amount);
  if (cents === null) {
    errors.amount = "اكتب مبلغًا صحيحًا (حتى رقمين بعد العلامة العشرية).";
  } else if (cents < MIN_WITHDRAWAL_CENTS) {
    errors.amount = "الحد الأدنى للسحب هو 100 ج.م.";
  } else if (cents > availableCents) {
    errors.amount = "المبلغ أكبر من رصيدك المتاح.";
  }

  if (!getPayoutMethod(method)) errors.method = "اختر طريقة السحب.";

  const cleanDetails = normalizeDigits(details).trim();
  if (method === "vodafone_cash") {
    if (!/^01[0125]\d{8}$/.test(cleanDetails)) {
      errors.details = "اكتب رقم موبايل مصري صحيح مكوّن من 11 رقم.";
    }
  } else if (cleanDetails.length < 5 || cleanDetails.length > 100) {
    errors.details = "اكتب بيانات الحساب (من 5 إلى 100 حرف).";
  }

  return { errors, cents, cleanDetails };
}

// بيتعمل mount جديد في كل مرة بتتفتح، فالحقول بتبدأ فاضية دايمًا
export default function WithdrawalModal({ availableBalance, onClose, onSuccess }) {
  const availableCents = toCents(availableBalance) ?? 0;

  const [step, setStep] = useState("form"); // form | review
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(PAYOUT_METHODS[0].value);
  const [details, setDetails] = useState("");
  const [errors, setErrors] = useState({});
  const [checked, setChecked] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const methodConfig = getPayoutMethod(method);

  function handleContinue(event) {
    event.preventDefault();
    const result = validate({ amount, method, details }, availableCents);
    setErrors(result.errors);
    if (Object.keys(result.errors).length > 0) return;

    setChecked({ cents: result.cents, method, details: result.cleanDetails });
    setSubmitError("");
    setStep("review");
  }

  async function handleConfirm() {
    if (submitting || !checked) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await requestWithdrawal({
        amount: centsToDecimalString(checked.cents),
        method: checked.method,
        details: checked.details,
      });
      onSuccess(formatCents(checked.cents));
    } catch (error) {
      setSubmitError(getWalletErrorMessage(error));
      setSubmitting(false);
    }
  }

  if (step === "review" && checked) {
    const reviewMethod = getPayoutMethod(checked.method);

    return (
      <Modal
        open
        title="مراجعة طلب السحب"
        onClose={onClose}
        closeDisabled={submitting}
      >
        <dl className="wallet-summary">
          <div>
            <dt>المبلغ</dt>
            <dd dir="ltr">
              {formatCents(checked.cents)} {CURRENCY_LABEL}
            </dd>
          </div>
          <div>
            <dt>طريقة السحب</dt>
            <dd>{reviewMethod?.label}</dd>
          </div>
          <div>
            <dt>{reviewMethod?.detailsLabel}</dt>
            <dd dir="ltr">{checked.details}</dd>
          </div>
        </dl>

        <p className="dash-dialog-message">
          هيتخصم المبلغ من رصيدك المتاح فورًا، وهيتحوّل لك بعد مراجعة الإدارة. لو
          اترفض الطلب هيرجع المبلغ لرصيدك.
        </p>

        {submitError ? (
          <p className="wallet-notice is-danger" role="alert">
            {submitError}
          </p>
        ) : null}

        <div className="dash-dialog-actions">
          <button
            type="button"
            className="dash-btn dash-btn-primary"
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? "جاري الإرسال..." : "تأكيد الطلب"}
          </button>
          <button
            type="button"
            className="dash-btn dash-btn-secondary"
            onClick={() => setStep("form")}
            disabled={submitting}
          >
            رجوع
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open title="طلب سحب" onClose={onClose}>
      <form className="wallet-modal-form" onSubmit={handleContinue} noValidate>
        <FormField
          label={`المبلغ (${CURRENCY_LABEL})`}
          required
          hint={`المتاح: ${formatCents(availableCents)} ${CURRENCY_LABEL} · الحد الأدنى 100 ${CURRENCY_LABEL}`}
          error={errors.amount}
        >
          <div className="wallet-amount-row">
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              dir="ltr"
              placeholder="0.00"
              className={`wallet-input${errors.amount ? " is-invalid" : ""}`}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <button
              type="button"
              className="dash-btn dash-btn-secondary"
              disabled={availableCents <= 0}
              onClick={() => setAmount(centsToDecimalString(availableCents))}
            >
              سحب الكل
            </button>
          </div>
        </FormField>

        <FormField label="طريقة السحب" required error={errors.method}>
          <select
            className="wallet-input"
            value={method}
            onChange={(event) => {
              setMethod(event.target.value);
              setErrors((current) => ({
                ...current,
                method: undefined,
                details: undefined,
              }));
            }}
          >
            {PAYOUT_METHODS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label={methodConfig?.detailsLabel ?? "بيانات الحساب"}
          required
          error={errors.details}
        >
          <input
            type="text"
            autoComplete="off"
            dir="ltr"
            placeholder={methodConfig?.placeholder}
            className={`wallet-input${errors.details ? " is-invalid" : ""}`}
            value={details}
            onChange={(event) => setDetails(event.target.value)}
          />
        </FormField>

        <div className="dash-dialog-actions">
          <button type="submit" className="dash-btn dash-btn-primary">
            متابعة
          </button>
          <button
            type="button"
            className="dash-btn dash-btn-secondary"
            onClick={onClose}
          >
            إلغاء
          </button>
        </div>
      </form>
    </Modal>
  );
}