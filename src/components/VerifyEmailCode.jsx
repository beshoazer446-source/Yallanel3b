import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function VerifyEmailCode({ email, onVerified, onBack }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function verify(e) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) {
      setError("اكتب الكود كامل");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code.trim(),
        type: "signup",
      });
      if (err) {
        setError("الكود غير صحيح أو انتهت صلاحيته");
        return;
      }
      if (!data.session) {
        setError("تم التحقق من الإيميل، لكنه لم ينشئ جلسة دخول. سجّل الدخول الآن.");
        return;
      }
      onVerified(data.user);
    } catch (verifyError) {
      setError(verifyError.message || "تعذر التحقق من الكود.");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
      });
      if (err) {
        setError(
          err.message.includes("seconds") ? "استنى شوية وجرّب تاني" : err.message,
        );
        return;
      }
      setInfo("بعتنا كود جديد على إيميلك");
      setCooldown(60);
    } catch (resendError) {
      setError(resendError.message || "تعذر إرسال كود جديد.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="auth-title">أكّد إيميلك</h1>
      <p className="auth-subtitle">
        بعتنا كود على {email}. لو ملقتهوش شوف الـ Spam.
      </p>

      {error && <div className="auth-error">{error}</div>}
      {info && <div className="auth-info">{info}</div>}

      <form onSubmit={verify} noValidate>
        <div className="auth-field">
          <label className="auth-label" htmlFor="code">
            الكود
          </label>
          <input
            id="code"
            className="auth-input"
            inputMode="numeric"
            maxLength={8}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary auth-submit"
          disabled={loading}
        >
          {loading ? "جاري التحقق..." : "تأكيد"}
        </button>
      </form>

      <p className="auth-switch">
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || loading}
          style={{
            background: "none",
            border: "none",
            color: "var(--green)",
            fontWeight: 700,
          }}
        >
          {cooldown > 0
            ? `إعادة إرسال الكود (${cooldown})`
            : "إعادة إرسال الكود"}
        </button>
        {" · "}
        <button
          type="button"
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: "var(--green)",
            fontWeight: 700,
          }}
        >
          تغيير الإيميل
        </button>
      </p>
    </>
  );
}
