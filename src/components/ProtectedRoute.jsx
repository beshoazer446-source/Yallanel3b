import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

// roles: أنواع الحسابات المسموح لها (لو مفيش، أي حد مسجّل دخول يقدر يدخل)
export default function ProtectedRoute({ roles }) {
  const { user, profile, loading, authError } = useAuth();
  const location = useLocation();

  if (loading) return <p style={{ padding: 24 }}>جاري التحميل...</p>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (authError) {
    return <p role="alert" style={{ padding: 24, color: "var(--status-cancelled)" }}>{authError}</p>;
  }

  if (roles) {
    if (!profile) return <p role="alert" style={{ padding: 24 }}>لم يتم العثور على ملف الحساب. تواصل مع الدعم.</p>;
    if (!roles.includes(profile.role)) {
      return (
        <section className="container" dir="rtl" style={{ paddingTop: 40, paddingBottom: 48 }}>
          <div className="card" style={{ maxWidth: 680, padding: 24 }}>
            <h1 style={{ color: "var(--green)" }}>صلاحية الحساب غير كافية</h1>
            <p style={{ marginTop: 12, color: "var(--text-muted)" }}>
              نوع حسابك الحالي ({profile.role}) لا يتيح فتح هذه الصفحة. لو سجلت كصاحب ملعب،
              تأكد أن حقل الدور في جدول profiles أصبح owner بعد تأكيد البريد.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
              <Link to="/register-owner" className="btn btn-primary">إنشاء حساب أونر</Link>
              <Link to="/venues" className="btn btn-outline" style={{ color: "var(--green)", borderColor: "var(--green)" }}>العودة للملاعب</Link>
            </div>
          </div>
        </section>
      );
    }
  }

  return <Outlet />;
}
