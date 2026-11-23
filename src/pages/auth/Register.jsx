import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { supabase } from "../../lib/supabaseClient";
import { homePath } from "../../lib/homePath";
import VerifyEmailCode from "../../components/VerifyEmailCode";
import "./Auth.css";

export default function Register({ role = "user" }) {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: البيانات | 2: كود التأكيد
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    agree: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  }

  function validate() {
    if (form.name.trim().length < 3) return "اكتب الاسم بالكامل";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "الإيميل غير صحيح";
    if (form.password.length < 6)
      return "كلمة المرور لازم تكون 6 حروف على الأقل";
    if (!/^01[0125]\d{8}$/.test(form.phone))
      return "رقم الهاتف غير صحيح (مثال: 01012345678)";
    if (!form.agree) return "لازم توافق على الشروط والأحكام";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setError("");
    setLoading(true);

    const email = form.email.trim().toLowerCase();

    try {
      const { data: confirmed, error: confirmedError } =
        await supabase.rpc("email_confirmed", { p_email: email });

      if (!confirmedError && confirmed) {
        setError("الإيميل ده مسجّل بالفعل. سجّل دخولك.");
        return;
      }

      const { data, error: err } = await signUp({
        name: form.name.trim(),
        email,
        password: form.password,
        phone: form.phone,
        role,
      });

      if (err) {
        setError(err.message);
        return;
      }

      // لو تأكيد الإيميل مقفول في Supabase بيدخل الحساب على طول
      if (data.session) {
        navigate(homePath(role === "owner" ? "owner" : "user"));
        return;
      }

      setStep(2);
    } catch (signupError) {
      setError(signupError.message || "تعذر إنشاء الحساب.");
    } finally {
      setLoading(false);
    }
  }

  if (step === 2) {
    return (
      <div className="auth-page">
        <div className="auth-panel">
          <div className="auth-box">
            <div className="auth-logo">
              <span className="auth-logo-mark" />
              يلا نلعب
            </div>
            <VerifyEmailCode
              email={form.email.trim()}
              onVerified={() =>
                navigate(homePath(role === "owner" ? "owner" : "user"))
              }
              onBack={() => setStep(1)}
            />
          </div>
        </div>
        <div className="auth-hero">
          <div className="auth-hero-quote">
            "كل مباراة عظيمة تبدأ بملعب جاهز."
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-box">
          <div className="auth-logo">
            <span className="auth-logo-mark" />
            يلا نلعب
          </div>

          <h1 className="auth-title">
            {role === "owner" ? "أنشئ حساب صاحب ملعب" : "أنشئ حسابك وابدأ اللعب"}
          </h1>
          <p className="auth-subtitle">
            {role === "owner"
              ? "أضف ملعبك وحدد الأسعار والمواعيد وتابع حجوزاتك."
              : "احجز أفضل الملاعب وتابع مبارياتك بسهولة."}
          </p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label className="auth-label" htmlFor="name">
                الاسم بالكامل
              </label>
              <input
                id="name"
                name="name"
                className="auth-input"
                placeholder="مثال: كريم محمود"
                value={form.name}
                onChange={handleChange}
              />
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="email">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="auth-input"
                placeholder="name@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="password">
                كلمة المرور
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="auth-input"
                placeholder="6 حروف على الأقل"
                value={form.password}
                onChange={handleChange}
              />
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="phone">
                رقم الهاتف
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="auth-input"
                placeholder="01xxxxxxxxx"
                value={form.phone}
                onChange={handleChange}
              />
            </div>

            <label className="auth-check">
              <input
                type="checkbox"
                name="agree"
                checked={form.agree}
                onChange={handleChange}
              />
              أوافق على الشروط والأحكام وسياسة الخصوصية
            </label>

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={loading}
            >
              {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
            </button>
          </form>

          <p className="auth-switch">
            لديك حساب بالفعل؟ <Link to="/login">تسجيل الدخول</Link>
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
