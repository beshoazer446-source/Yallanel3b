import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useTheme } from "../../context/useTheme";
import "./OwnerSettingsPage.css";

const DEFAULT_SETTINGS = {
  fullName: "",
  phone: "",
  businessName: "",
};

function getStorageKey(userId) {
  return `yn_owner_settings_${userId || "guest"}`;
}

export default function OwnerSettingsPage() {
  const auth = useAuth();
  const user = auth?.user ?? null;

  const { theme } = useTheme();
  const activeTheme =
    theme === "dark" || theme === "light"
      ? theme
      : document.documentElement.dataset.theme === "dark"
        ? "dark"
        : "light";

  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const key = getStorageKey(user?.id);
    let saved = {};
    try {
      const raw = localStorage.getItem(key);
      if (raw) saved = JSON.parse(raw);
    } catch {
      saved = {};
    }

    const meta = user?.user_metadata || {};
    setForm({
      ...DEFAULT_SETTINGS,
      fullName:
        saved.fullName ??
        meta.full_name ??
        meta.name ??
        user?.email?.split("@")[0] ??
        "",
      phone: saved.phone ?? meta.phone ?? user?.phone ?? "",
      businessName: saved.businessName ?? meta.venue_brand ?? "",
    });
  }, [user]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (statusMsg.text) setStatusMsg({ type: "", text: "" });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setStatusMsg({ type: "", text: "" });

    try {
      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        businessName: form.businessName.trim(),
      };
      localStorage.setItem(getStorageKey(user?.id), JSON.stringify(payload));
      setForm(payload);
      setStatusMsg({
        type: "success",
        text: "تم حفظ بيانات الحساب بنجاح.",
      });
    } catch {
      setStatusMsg({
        type: "error",
        text: "تعذر حفظ البيانات حالياً، حاول مرة أخرى.",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    const meta = user?.user_metadata || {};
    const resetData = {
      ...DEFAULT_SETTINGS,
      fullName: meta.full_name ?? meta.name ?? "",
      phone: meta.phone ?? user?.phone ?? "",
    };
    setForm(resetData);
    try {
      localStorage.removeItem(getStorageKey(user?.id));
    } catch {
      // ignore storage errors
    }
    setStatusMsg({
      type: "success",
      text: "تمت استعادة البيانات الافتراضية.",
    });
  }

  return (
    <section
      className="yn-settings-page"
      data-theme={activeTheme}
      dir="rtl"
    >
      <form className="yn-settings-container" onSubmit={handleSubmit}>
        <header className="yn-settings-header">
          <div className="yn-settings-heading">
            <div className="yn-settings-mark" aria-hidden="true">
              ح
            </div>
            <div>
              <h1>الحساب الشخصي</h1>
              <p>
                إدارة الاسم الكامل، رقم الهاتف، واسم الكيان أو مجموعة الملاعب.
              </p>
            </div>
          </div>

          <div className="yn-settings-actions">
            <Link to="/owner/dashboard" className="yn-settings-btn secondary">
              لوحة التحكم
            </Link>
            <button
              type="submit"
              className="yn-settings-btn"
              disabled={saving}
            >
              {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
          </div>
        </header>

        {statusMsg.text && (
          <div
            className={`yn-settings-alert ${statusMsg.type}`}
            role="status"
          >
            {statusMsg.text}
          </div>
        )}

        <div className="yn-settings-card">
          <h2>بيانات الحساب والتواصل</h2>
          <p className="yn-settings-card-sub">
            المعلومات الأساسية الظاهرة في حسابك كصاحب ملعب.
          </p>

          <div className="yn-field">
            <label htmlFor="owner-full-name">الاسم الكامل</label>
            <input
              id="owner-full-name"
              type="text"
              value={form.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              placeholder="مثال: كريم أحمد"
            />
          </div>

          <div className="yn-field">
            <label htmlFor="owner-phone">رقم الهاتف</label>
            <input
              id="owner-phone"
              type="tel"
              dir="ltr"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="01xxxxxxxxx"
            />
          </div>

          <div className="yn-field">
            <label htmlFor="owner-brand">اسم الكيان أو مجموعة الملاعب</label>
            <input
              id="owner-brand"
              type="text"
              value={form.businessName}
              onChange={(e) => handleChange("businessName", e.target.value)}
              placeholder="مثال: ملاعب النجوم"
            />
          </div>
        </div>

        <div className="yn-settings-footer">
          <button
            type="button"
            className="yn-settings-btn secondary"
            onClick={handleReset}
          >
            استعادة الافتراضي
          </button>
          <button
            type="submit"
            className="yn-settings-btn"
            disabled={saving}
          >
            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </form>
    </section>
  );
}