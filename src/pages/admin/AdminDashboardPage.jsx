import { useEffect, useState } from "react";
import { getAdminOverview } from "../../services/venuesService";

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getAdminOverview()
      .then((result) => {
        if (active) setOverview(result);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "تعذر تحميل بيانات المنصة.");
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="container" dir="rtl" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <h1 style={{ color: "var(--green)" }}>لوحة الأدمن</h1>
      {error ? (
        <p role="alert" style={{ marginTop: 20, color: "var(--status-cancelled)" }}>{error}</p>
      ) : !overview ? (
        <p style={{ padding: 24 }}>جاري تحميل بيانات المنصة...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginTop: 20 }}>
          <Metric label="الحسابات" value={overview.profiles} />
          <Metric label="الملاعب" value={overview.venues} />
          <Metric label="الحجوزات" value={overview.bookings} />
          <Metric label="عمولة المنصة المستحقة (10%)" value={`${overview.platformCommission.toFixed(2)} ج.م`} />
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <article className="card" style={{ padding: 20 }}>
      <p style={{ color: "var(--text-muted)" }}>{label}</p>
      <strong style={{ display: "block", marginTop: 8, color: "var(--green)", fontSize: 30 }}>{value}</strong>
    </article>
  );
}
