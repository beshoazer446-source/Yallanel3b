import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { supabase } from "../../lib/supabaseClient";
import { homePath } from "../../lib/homePath";
import "./Auth.css";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.email.trim() || !form.password) {
      setError("اكتب الإيميل وكلمة المرور");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { data, error: err } = await signIn({
        email: form.email.trim(),
        password: form.password,
      });

      if (err) {
        setError(
          err.message.includes("Invalid login credentials")
            ? "بيانات الدخول غير صحيحة. راجع البريد وكلمة المرور."
            : err.message,
        );
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();
      if (profileError) {
        setError(`تم تسجيل الدخول لكن تعذر تحميل نوع الحساب: ${profileError.message}`);
        return;
      }

      navigate(location.state?.from?.pathname || homePath(profile.role), { replace: true });
    } catch (loginError) {
      setError(loginError.message || "تعذر تسجيل الدخول.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-box">
          <div className="auth-logo">
            <span className="auth-logo-mark" />
            يلا نلعب
          </div>

          <h1 className="auth-title">أهلاً بعودتك</h1>
          <p className="auth-subtitle">
            سجّل دخولك لإدارة حجوزاتك ومواعيد فريقك.
          </p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
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
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={loading}
            >
              {loading ? "جاري الدخول..." : "تسجيل الدخول"}
            </button>
          </form>
          <p className="auth-switch">
            <Link to="/forgot-password">نسيت كلمة المرور؟</Link>
          </p>
          <p className="auth-switch">
            ليس لديك حساب؟ <Link to="/register">أنشئ حساباً جديداً</Link>
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
