import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { AuthContext } from "../context/authContext";
import "./profile-page.css";

function getInitials(name, email) {
  const source = (name || email || "U").trim();
  const parts = source.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export default function Profile() {
  const auth = useContext(AuthContext);
  const user = auth?.user ?? null;
  const profile = auth?.profile ?? null;
  const authLoading = auth?.loading ?? false;

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nameColumn, setNameColumn] = useState("full_name");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("user");
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function hydrateProfile() {
      if (authLoading) return;

      if (!user) {
        if (isMounted) {
          setFeedback({
            type: "error",
            message: "تعذر تحميل بيانات الحساب. يرجى تسجيل الدخول مرة أخرى.",
          });
          setLoadingProfile(false);
        }
        return;
      }

      setLoadingProfile(true);
      setFeedback(null);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!isMounted) return;

      const sourceData = !error && data ? data : profile || {};
      const detectedNameCol =
        "full_name" in sourceData
          ? "full_name"
          : "name" in sourceData
            ? "name"
            : "full_name";

      setNameColumn(detectedNameCol);
      setFullName(
        sourceData.full_name ||
          sourceData.name ||
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          "",
      );
      setPhone(sourceData.phone || user.user_metadata?.phone || "");
      const rawRole = sourceData.role || user.user_metadata?.role || "user";
      setRole(rawRole === "admin" ? "admin" : rawRole);
      setLoadingProfile(false);
    }

    hydrateProfile();
    return () => {
      isMounted = false;
    };
  }, [user, profile, authLoading]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user?.id) return;

    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setFeedback({
        type: "error",
        message: "من فضلك أدخل الاسم قبل حفظ التغييرات.",
      });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const payload = {
      [nameColumn]: trimmedName,
      phone: trimmedPhone,
    };

    const { error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      setFeedback({
        type: "error",
        message: "حدث خطأ أثناء حفظ التغييرات. حاول مرة أخرى.",
      });
      return;
    }

    setFeedback({
      type: "success",
      message: "تم حفظ بيانات الحساب بنجاح.",
    });
  }

  const isLoading = authLoading || loadingProfile;
  const isAdmin = role === "admin";
  const email = user?.email || "";

  return (
    <section className="yn-profile-page" dir="rtl">
      <div className="yn-profile-container">
        <header className="yn-profile-header-card">
          <div className="yn-profile-identity">
            <div
              className={`yn-profile-avatar ${isAdmin ? "is-admin" : "is-user"}`}
              aria-hidden="true"
            >
              {getInitials(fullName, email)}
            </div>

            <div className="yn-profile-meta">
              <div className="yn-profile-title-row">
                <h1>حسابي</h1>
                <span className={`yn-role-badge ${isAdmin ? "is-admin" : "is-user"}`}>
                  {isAdmin ? "مدير ملعب" : "المستخدم"}
                </span>
              </div>
              <p className="yn-profile-email" dir="ltr">
                {isLoading ? "جاري التحميل..." : email}
              </p>
            </div>
          </div>

          <div className="yn-role-shortcuts">
            {isAdmin ? (
              <>
                <Link to="/venues" className="yn-shortcut-btn primary">
                  استعراض الملاعب
                </Link>
                <Link to="/owner/bookings" className="yn-shortcut-btn secondary">
                  إدارة الحجوزات
                </Link>
              </>
            ) : (
              <>
                <Link to="/my-bookings" className="yn-shortcut-btn primary">
                  حجوزاتي
                </Link>
                <Link to="/venues" className="yn-shortcut-btn secondary">
                  استكشاف الملاعب
                </Link>
              </>
            )}
          </div>
        </header>

        <div className="yn-profile-grid">
          <form className="yn-profile-form-card" onSubmit={handleSubmit}>
            <h2>البيانات الشخصية</h2>
            <p className="yn-card-subtitle">
              حدّث بياناتك الأساسية لضمان سهولة التواصل وتأكيد الحجوزات.
            </p>

            {feedback && (
              <div
                className={`yn-alert ${feedback.type === "success" ? "success" : "error"}`}
                role="status"
              >
                {feedback.message}
              </div>
            )}

            <div className="yn-field-group">
              <label htmlFor="profile-email">البريد الإلكتروني</label>
              <input
                id="profile-email"
                type="email"
                value={email}
                disabled
                dir="ltr"
                className="yn-input yn-input-readonly"
              />
            </div>

            <div className="yn-field-group">
              <label htmlFor="profile-name">الاسم</label>
              <input
                id="profile-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="اكتب اسمك الكامل"
                disabled={isLoading || saving}
                className="yn-input"
              />
            </div>

            <div className="yn-field-group">
              <label htmlFor="profile-phone">رقم الهاتف</label>
              <input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                disabled={isLoading || saving}
                dir="ltr"
                className="yn-input"
              />
            </div>

            <div className="yn-form-actions">
              <button
                type="submit"
                disabled={isLoading || saving}
                className="yn-save-btn"
              >
                {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
              </button>
            </div>
          </form>

          <aside className="yn-role-info-card">
            {isAdmin ? (
              <>
                <span className="yn-aside-tag admin-tag">حساب مدير ملعب</span>
                <h3>إدارة الملاعب والحجوزات</h3>
                <p>
                  بصفتك مدير ملعب في منصة يلا نلعب، يمكنك متابعة الملاعب المسجلة،
                  مراجعة حجوزات اللاعبين، وتحديث بيانات التواصل الخاصة بك.
                </p>
                <ul className="yn-role-checklist">
                  <li>متابعة طلبات الحجز وحالات التأكيد</li>
                  <li>مراجعة بيانات الملاعب والمواعيد</li>
                  <li>حفظ بيانات التواصل الخاصة بإدارة الملعب</li>
                </ul>
              </>
            ) : (
              <>
                <span className="yn-aside-tag user-tag">حساب المنصة</span>
                <h3>تجربة حجز أسرع وأوضح</h3>
                <p>
                  تأكد من صحة رقم هاتفك واسمك لتسهيل التواصل وتأكيد الحجوزات دون
                  تأخير.
                </p>
                <ul className="yn-role-checklist">
                  <li>متابعة حالة الحجوزات من صفحة «حجوزاتي»</li>
                  <li>تصفح الملاعب ومقارنة الأسعار والمواعيد</li>
                  <li>تحديث بيانات التواصل في أي وقت</li>
                </ul>
              </>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}