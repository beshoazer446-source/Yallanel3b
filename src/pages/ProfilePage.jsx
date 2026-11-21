import { useState } from "react";
import { useAuth } from "../context/useAuth";

export default function ProfilePage() {
  const { profile, updateProfile } = useAuth();
  const [name, setName] = useState(profile?.name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (name.trim().length < 3) {
      setError("اكتب الاسم بالكامل.");
      return;
    }

    setError("");
    setSaved(false);
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim() });
      setSaved(true);
    } catch (saveError) {
      setError(saveError.message || "تعذر حفظ بيانات الحساب.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="container" dir="rtl" style={{ maxWidth: 680, paddingTop: 32, paddingBottom: 48 }}>
      <div className="card" style={{ padding: 24 }}>
        <h1 style={{ color: "var(--green)" }}>حسابي</h1>
        <p style={{ color: "var(--text-muted)", marginTop: 8 }}>{profile?.email}</p>
        {error && <p role="alert" style={{ color: "var(--status-cancelled)", marginTop: 16 }}>{error}</p>}
        {saved && <p role="status" style={{ color: "var(--status-confirmed)", marginTop: 16 }}>تم تحديث بياناتك.</p>}

        <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
          <label htmlFor="profile-name" style={{ display: "block", fontWeight: 700 }}>الاسم</label>
          <input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} required minLength={3} style={fieldStyle} />

          <label htmlFor="profile-phone" style={{ display: "block", fontWeight: 700, marginTop: 16 }}>رقم الهاتف</label>
          <input id="profile-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} style={fieldStyle} />

          <p style={{ marginTop: 16 }}>نوع الحساب: {profile?.role}</p>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 20 }}>
            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </form>
      </div>
    </section>
  );
}

const fieldStyle = {
  display: "block",
  width: "100%",
  marginTop: 8,
  padding: 12,
  border: "1px solid var(--border)",
  borderRadius: 10,
  background: "var(--white)",
  color: "var(--text)",
};
