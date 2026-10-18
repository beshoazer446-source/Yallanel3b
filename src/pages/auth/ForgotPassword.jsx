import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { homePath } from "../../lib/homePath";
import "./Auth.css";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: الإيميل | 2: الكود | 3: كلمة مرور جديدة
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [noAccount, setNoAccount] = useState(false);
  const [loading, setLoading] = useState(false);

  // الخطوة 1: ابعت الكود
  async function sendCode(e) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("الإيميل غير صحيح");
      return;
    }
    setError("");
    setNoAccount(false);
    setLoading(true);

    const { data: exists } = await supabase.rpc("email_exists", {
      p_email: email.trim(),
    });
    if (!exists) {
      setLoading(false);
      setNoAccount(true);
      return;
    }

    const { error: err } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
    );
    setLoading(false);
    if (err) {
      setError(
        err.message.includes("seconds")
          ? "استنى دقيقة وجرّب تاني"
          : err.message,
      );
      return;
    }
    setStep(2);
  }

  // الخطوة 2: اتأكد من الكود
  async function verifyCode(e) {
    e.preventDefault();
    if (code.trim().length < 6) {
      setError("اكتب الكود كامل");
      return;
    }
    setError("");
    setLoading(true);

    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "recovery",
    });
    setLoading(false);
    if (err) {
      setError("الكود غير صحيح أو انتهت صلاحيته");
      return;
    }
    setStep(3);
  }

  // الخطوة 3: احفظ كلمة المرور الجديدة
  async function savePassword(e) {
    e.preventDefault();
    if (password.length < 6) {
      setError("كلمة المرور لازم تكون 6 حروف على الأقل");
      return;
    }
    if (password !== confirm) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    setError("");
    setLoading(true);

    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setLoading(false);
      setError(err.message);
      return;
    }

    const { data } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();
    setLoading(false);
    navigate(homePath(profile?.role));
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-box">
          <div className="auth-logo">
            <span className="auth-logo-mark" />
            يلا نلعب
          </div>

          {step === 1 && (
            <>
              <h1 className="auth-title">نسيت كلمة المرور؟</h1>
              <p className="auth-subtitle">
                اكتب إيميلك وهنبعتلك كود لاستعادة حسابك.
              </p>
            </>
          )}
          {step === 2 && (
            <>
              <h1 className="auth-title">اكتب الكود</h1>
              <p className="auth-subtitle">
                بعتنا كود على {email}. لو ملقتهوش شوف الـ Spam.
              </p>
            </>
          )}
          {step === 3 && (
            <>
              <h1 className="auth-title">كلمة مرور جديدة</h1>
              <p className="auth-subtitle">اختار كلمة مرور جديدة لحسابك.</p>
            </>
          )}

          {error && <div className="auth-error">{error}</div>}
          {noAccount && (
            <div className="auth-info">
              مفيش حساب بالإيميل ده.{" "}
              <Link to="/register">أنشئ حساباً أولاً</Link>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={sendCode} noValidate>
              <div className="auth-field">
                <label className="auth-label" htmlFor="email">
                  البريد الإلكتروني
                </label>
                <input
                  id="email"
                  type="email"
                  className="auth-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary auth-submit"
                disabled={loading}
              >
                {loading ? "جاري الإرسال..." : "إرسال الكود"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={verifyCode} noValidate>
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
                {loading ? "جاري التحقق..." : "تأكيد الكود"}
              </button>
              <p className="auth-switch">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setStep(1);
                    setCode("");
                  }}
                >
                  تغيير الإيميل أو إعادة إرسال الكود
                </a>
              </p>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={savePassword} noValidate>
              <div className="auth-field">
                <label className="auth-label" htmlFor="password">
                  كلمة المرور الجديدة
                </label>
                <input
                  id="password"
                  type="password"
                  className="auth-input"
                  placeholder="6 حروف على الأقل"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="confirm">
                  تأكيد كلمة المرور
                </label>
                <input
                  id="confirm"
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary auth-submit"
                disabled={loading}
              >
                {loading ? "جاري الحفظ..." : "حفظ ودخول"}
              </button>
            </form>
          )}

          <p className="auth-switch">
            <Link to="/login">الرجوع لتسجيل الدخول</Link>
          </p>
        </div>
      </div>

      <div className="auth-hero">
        <div className="auth-hero-quote">
          "كل مباراة عظيمة تبدأ بملعب جاهز."
        </div>
        <div className="auth-hero-stats">120+ ملعب · 18,000+ حجز ناجح</div>
      </div>
    </div>
  );
}
