
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../owner/OwnerPages.css";

const statsList = [
  {
    key: "todayRevenue",
    title: "إيرادات اليوم",
    note: "جنيه مصري",
    icon: "ج",
  },
  {
    key: "todayBookings",
    title: "حجوزات اليوم",
    note: "حجز",
    icon: "ح",
  },
  {
    key: "confirmed",
    title: "حجوزات مؤكدة",
    note: "حجز",
    icon: "✓",
  },
  {
    key: "pending",
    title: "حجوزات معلّقة",
    note: "تحتاج مراجعة",
    icon: "!",
  },
  {
    key: "monthlyRevenue",
    title: "إيرادات الشهر",
    note: "جنيه مصري",
    icon: "م",
  },
  {
    key: "totalBookings",
    title: "إجمالي الحجوزات",
    note: "حجز",
    icon: "ك",
  },
];

export default function OwnerDashboard() {
  const { profile, user, loading: authLoading } = useAuth();

  const [stats] = useState({
    todayRevenue: 0,
    todayBookings: 0,
    confirmed: 0,
    pending: 0,
    monthlyRevenue: 0,
    totalBookings: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setError("سجّل الدخول بحسابك عشان تقدر تعرض الإحصائيات.");
    } else {
      setError("");
    }

    setLoading(false);
  }, [user, authLoading]);

  const formatNumber = (value) => {
    return new Intl.NumberFormat("ar-EG").format(value ?? 0);
  };

  return (
    <main className="owner-page">
      <div className="owner-container">
        <header className="owner-header">
          <div className="owner-heading">
            <div className="owner-heading-mark">Y</div>

            <div>
              <h1>لوحة صاحب الملعب</h1>

              <p>
                أهلاً {profile?.name || user?.user_metadata?.name || "بك"}،
                تابع نشاط ملعبك وحجوزاتك.
              </p>
            </div>
          </div>

          <div className="owner-actions">
            <Link className="owner-btn" to="/owner/bookings">
              إدارة الحجوزات
            </Link>

            <Link className="owner-btn secondary" to="/venues">
              عرض الملاعب
            </Link>
          </div>
        </header>

        {error && <div className="owner-notice">{error}</div>}

        <section className="owner-stats">
          {statsList.map((item) => (
            <article className="owner-stat" key={item.key}>
              <div className="owner-stat-icon">{item.icon}</div>

              <p>{item.title}</p>

              <h2>
                {loading ? "..." : formatNumber(stats[item.key])}
              </h2>

              <small>{item.note}</small>
            </article>
          ))}
        </section>

        <section className="owner-panel">
          <div className="owner-panel-heading">
            <h2>متابعة الحجوزات</h2>

            <Link
              className="owner-btn secondary"
              to="/owner/bookings"
            >
              عرض الحجوزات
            </Link>
          </div>

          <p>
            من هنا تقدر تتابع طلبات الحجز وتراجع الحجوزات المعلّقة
            وتتابع الإيرادات بعد ربط الصفحة بقاعدة البيانات.
          </p>
        </section>
      </div>
    </main>
  );
}
