import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { getOwnerBookings } from "../../services/bookingsService";
import { getOwnerVenues } from "../../services/venuesService";
import { PLATFORM_COMMISSION_PERCENT } from "../../lib/constants";
import { supabase } from "../../lib/supabaseClient";
import "./OwnerPages.css";

const statusLabels = {
  pending: "قيد المراجعة",
  confirmed: "مؤكد",
  rejected: "مرفوض",
  cancelled: "ملغي",
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("ar-EG", {
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatTime12(timeStr) {
  if (!timeStr) return "";
  const parts = timeStr.slice(0, 5).split(":");
  let hour = parseInt(parts[0], 10);
  const minutes = parts[1] || "00";
  const period = hour >= 12 ? "م" : "ص";
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${minutes} ${period}`;
}

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const location = useLocation();

  const [venues, setVenues] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [timeframe, setTimeframe] = useState("weekly"); // "weekly" | "monthly"
  const [quickTab, setQuickTab] = useState("today"); // "today" | "upcoming"
  const [realtimeAlert, setRealtimeAlert] = useState(null);

  // دالة تحميل البيانات المركزية
  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [ownedVenues, ownerBookings] = await Promise.all([
        getOwnerVenues(user.id),
        getOwnerBookings(user.id),
      ]);
      setVenues(ownedVenues);
      setBookings(ownerBookings);
    } catch (loadError) {
      setError(loadError.message || "تعذر تحميل بيانات لوحة التحكم.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // الاشتراك في التنبيهات اللحظية من Supabase Realtime
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`owner-bookings-realtime-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        (payload) => {
          const nowFormatted = new Date().toLocaleTimeString("ar-EG", {
            hour: "2-digit",
            minute: "2-digit",
          });

          if (payload.eventType === "INSERT") {
            setRealtimeAlert({
              id: Date.now(),
              type: "new",
              message: "وصل طلب حجز جديد لملاعبك! تم تحديث الأرقام تلقائيًا.",
              time: nowFormatted,
            });
          } else if (payload.eventType === "UPDATE") {
            const newStatus = payload.new?.status;
            if (newStatus === "cancelled") {
              setRealtimeAlert({
                id: Date.now(),
                type: "cancelled",
                message: "تم إلغاء أحد الحجوزات. تم تحديث البيانات تلقائيًا.",
                time: nowFormatted,
              });
            } else {
              setRealtimeAlert({
                id: Date.now(),
                type: "update",
                message: `تم تحديث حالة حجز (${statusLabels[newStatus] || newStatus}).`,
                time: nowFormatted,
              });
            }
          }

          // إعادة تحميل البيانات فورياً لمزامنة الداشبورد
          loadDashboardData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadDashboardData]);

  // الحسابات والإحصائيات المالية
  const analytics = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const confirmed = bookings.filter((b) => b.status === "confirmed");
    const pending = bookings.filter((b) => b.status === "pending");

    // 1. إجمالي الإيرادات وعمولة المنصة وصافي الأرباح
    const grossRevenue = confirmed.reduce(
      (sum, b) => sum + (Number(b.price) || 0),
      0,
    );
    const platformCommission = (grossRevenue * PLATFORM_COMMISSION_PERCENT) / 100;
    const netEarnings = grossRevenue - platformCommission;

    // 2. إيرادات الشهر الحالي
    const thisMonthConfirmed = confirmed.filter((b) =>
      b.date?.startsWith(currentMonthStr),
    );
    const thisMonthGross = thisMonthConfirmed.reduce(
      (sum, b) => sum + (Number(b.price) || 0),
      0,
    );
    const thisMonthNet =
      thisMonthGross * (1 - PLATFORM_COMMISSION_PERCENT / 100);

    // 3. إيرادات وحجوزات اليوم
    const todayConfirmed = confirmed.filter((b) => b.date === todayStr);
    const todayGross = todayConfirmed.reduce(
      (sum, b) => sum + (Number(b.price) || 0),
      0,
    );

    // 4. نسبة الإشغال (بناءً على الشهر الحالي)
    // افتراض: اليوم التشغيلي للملعب = 10 ساعات
    const currentDay = Math.max(1, now.getDate());
    const totalPotentialHours =
      Math.max(1, venues.length) * 10 * currentDay;
    const bookedHoursThisMonth = thisMonthConfirmed.length;
    const occupancyRate =
      venues.length > 0
        ? Math.min(100, Math.round((bookedHoursThisMonth / totalPotentialHours) * 100))
        : 0;

    // 5. أكتر ملعب مطلوب
    const venueStats = {};
    venues.forEach((v) => {
      venueStats[v.id] = { name: v.name, count: 0, revenue: 0 };
    });
    confirmed.forEach((b) => {
      if (venueStats[b.venue_id]) {
        venueStats[b.venue_id].count += 1;
        venueStats[b.venue_id].revenue += Number(b.price) || 0;
      }
    });
    const sortedVenues = Object.values(venueStats).sort(
      (a, b) => b.count - a.count,
    );
    const topVenue = sortedVenues[0] && sortedVenues[0].count > 0 ? sortedVenues[0] : null;

    // 6. ساعات الذروة (أكتر ساعات ازدحاماً)
    const hourCounts = {};
    confirmed.forEach((b) => {
      const hour = b.start_time?.slice(0, 2);
      if (hour) {
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });
    const peakHourEntry = Object.entries(hourCounts).sort(
      (a, b) => b[1] - a[1],
    )[0];
    let peakHoursText = "لا توجد بيانات كافية";
    if (peakHourEntry && peakHourEntry[1] > 0) {
      const startH = parseInt(peakHourEntry[0], 10);
      const endH = (startH + 1) % 24;
      peakHoursText = `${formatTime12(`${startH}:00`)} - ${formatTime12(`${endH}:00`)}`;
    }

    // 7. بيانات الرسم البياني الأسبوعي (آخر 7 أيام)
    const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const weeklyChartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dayBookings = confirmed.filter((b) => b.date === dStr);
      const dayRevenue = dayBookings.reduce(
        (sum, b) => sum + (Number(b.price) || 0),
        0,
      );
      weeklyChartData.push({
        label: i === 0 ? "اليوم" : dayNames[d.getDay()],
        date: dStr,
        revenue: dayRevenue,
        bookingsCount: dayBookings.length,
        isToday: i === 0,
      });
    }

    // 8. بيانات الرسم البياني الشهري (آخر 6 شهور)
    const arabicMonths = [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ];
    const monthlyChartData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const mBookings = confirmed.filter((b) => b.date?.startsWith(mStr));
      const mRevenue = mBookings.reduce(
        (sum, b) => sum + (Number(b.price) || 0),
        0,
      );
      monthlyChartData.push({
        label: arabicMonths[d.getMonth()],
        monthKey: mStr,
        revenue: mRevenue,
        bookingsCount: mBookings.length,
        isCurrent: i === 0,
      });
    }

    // 9. قوائم الحجوزات السريعة
    const todayList = bookings
      .filter((b) => b.date === todayStr)
      .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));

    const upcomingList = bookings
      .filter((b) => b.date > todayStr)
      .sort(
        (a, b) =>
          (a.date || "").localeCompare(b.date || "") ||
          (a.start_time || "").localeCompare(b.start_time || ""),
      )
      .slice(0, 8);

    return {
      confirmedCount: confirmed.length,
      pendingCount: pending.length,
      grossRevenue,
      platformCommission,
      netEarnings,
      thisMonthGross,
      thisMonthNet,
      todayGross,
      occupancyRate,
      topVenue,
      peakHoursText,
      weeklyChartData,
      monthlyChartData,
      todayList,
      upcomingList,
    };
  }, [bookings, venues]);

  // حساب أقصى قيمة للأعمدة لتطبيع الارتفاع
  const currentChartData =
    timeframe === "weekly"
      ? analytics.weeklyChartData
      : analytics.monthlyChartData;

  const maxRevenue = Math.max(
    ...currentChartData.map((item) => item.revenue),
    100,
  );
  const maxBookings = Math.max(
    ...currentChartData.map((item) => item.bookingsCount),
    5,
  );

  return (
    <main className="owner-page" dir="rtl">
      <div className="owner-container">
        {/* الترويسة الرئيسية */}
        <header className="owner-header">
          <div className="owner-heading">
            <div className="owner-heading-mark">🏟️</div>
            <div>
              <h1>لوحة تحكم صاحب الملعب</h1>
              <p>متابعة الإيرادات، صافي الأرباح، ونشاط الملاعب لحظة بلحظة</p>
            </div>
          </div>
          <div className="owner-actions">
            <Link to="/owner/venues/new" className="owner-btn">
              + إضافة ملعب
            </Link>
            <Link to="/owner/bookings" className="owner-btn secondary">
              إدارة الحجوزات
            </Link>
          </div>
        </header>

        {/* إشعار عند حفظ ملعب بنجاح من صفحة أخرى */}
        {location.state?.venueSaved && (
          <div className="owner-notice" style={{ color: "var(--status-confirmed)", borderColor: "#bce8ce" }}>
            ✓ تم حفظ ملعب {location.state.venueSaved} بنجاح.
          </div>
        )}

        {/* شريط الإشعارات اللحظية من Supabase Realtime */}
        {realtimeAlert && (
          <aside
            className={`owner-realtime-alert ${realtimeAlert.type === "cancelled" ? "cancelled" : ""}`}
            role="status"
          >
            <div className="owner-realtime-alert-content">
              <span className="owner-realtime-badge">تحديث لحظي</span>
              <span>{realtimeAlert.message}</span>
              <small style={{ opacity: 0.75 }}>({realtimeAlert.time})</small>
            </div>
            <button
              type="button"
              className="owner-alert-close"
              onClick={() => setRealtimeAlert(null)}
              aria-label="إغلاق التنبيه"
            >
              ✕
            </button>
          </aside>
        )}

        {loading ? (
          <div className="owner-panel" style={{ textAlign: "center", padding: "60px 20px" }}>
            <p style={{ color: "var(--green)", fontWeight: 700, fontSize: 18 }}>
              جاري تحميل إحصائياتك وتحليل الحجوزات...
            </p>
          </div>
        ) : error ? (
          <div className="owner-notice" role="alert" style={{ color: "var(--status-cancelled)" }}>
            {error}
          </div>
        ) : (
          <>
            {/* 1. الكروت المالية الرئيسية: صافي الأرباح وإجمالي الإيرادات */}
            <section className="owner-financial-grid">
              {/* كارت صافي الأرباح (البطل الرئيسي) */}
              <article className="owner-hero-stat">
                <div className="owner-hero-stat-header">
                  <span style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
                    صافي مستحقاتك
                  </span>
                  <span className="owner-hero-stat-tag">بعد خصم العمولة</span>
                </div>
                <div>
                  <div className="owner-hero-stat-value">
                    {formatCurrency(analytics.netEarnings)}
                    <span>جنيه مصري</span>
                  </div>
                  <div className="owner-hero-stat-formula">
                    الإجمالي: {formatCurrency(analytics.grossRevenue)} ج.م — عمولة المنصة ({PLATFORM_COMMISSION_PERCENT}%): {formatCurrency(analytics.platformCommission)} ج.م
                  </div>
                </div>
              </article>

              {/* إيرادات الشهر الحالي */}
              <article className="owner-stat">
                <div className="owner-stat-icon">📅</div>
                <p>إيرادات هذا الشهر</p>
                <h2>{formatCurrency(analytics.thisMonthGross)} <small style={{ fontSize: 14 }}>ج.م</small></h2>
                <small>صافي هذا الشهر: {formatCurrency(analytics.thisMonthNet)} ج.م</small>
              </article>

              {/* نسبة الإشغال */}
              <article className="owner-stat">
                <div className="owner-stat-icon">📊</div>
                <p>نسبة الإشغال المقدرة</p>
                <h2>{analytics.occupancyRate}%</h2>
                <div className="owner-occupancy-wrap">
                  <div className="owner-occupancy-bar">
                    <div
                      className="owner-occupancy-fill"
                      style={{ width: `${analytics.occupancyRate}%` }}
                    />
                  </div>
                  <small style={{ marginTop: 6, display: "block" }}>
                    محسوبة بناءً على سعة ملاعبك هذا الشهر
                  </small>
                </div>
              </article>
            </section>

            {/* بطاقات الإحصائيات السريعة الإضافية */}
            <section className="owner-stats">
              <article className="owner-stat">
                <div className="owner-stat-icon">⚽</div>
                <p>إجمالي الملاعب</p>
                <h2>{venues.length}</h2>
                <small>ملاعب نشطة ومسجلة</small>
              </article>

              <article className="owner-stat">
                <div className="owner-stat-icon">✓</div>
                <p>الحجوزات المؤكدة</p>
                <h2>{analytics.confirmedCount}</h2>
                <small>حجز مدفوع ومكتمل</small>
              </article>

              <article className="owner-stat">
                <div className="owner-stat-icon">⏳</div>
                <p>حجوزات معلقة</p>
                <h2 style={{ color: analytics.pendingCount > 0 ? "var(--status-pending)" : "var(--green)" }}>
                  {analytics.pendingCount}
                </h2>
                <small>{analytics.pendingCount > 0 ? "تحتاج مراجعتك فوراً" : "لا توجد طلبات معلقة"}</small>
              </article>

              <article className="owner-stat">
                <div className="owner-stat-icon">💵</div>
                <p>إيرادات اليوم</p>
                <h2>{formatCurrency(analytics.todayGross)} <small style={{ fontSize: 13 }}>ج.م</small></h2>
                <small>من حجوزات اليوم المؤكدة</small>
              </article>
            </section>

            {/* بطاقات التحليل الذكي: الملعب الأكثر طلباً وساعات الذروة */}
            <section className="owner-insights-grid">
              <div className="owner-insight-card">
                <div className="owner-insight-icon">🏆</div>
                <div className="owner-insight-info">
                  <h4>أكثر ملعب مطلوب</h4>
                  <p>{analytics.topVenue?.name || "لا توجد حجوزات كافية بعد"}</p>
                  <small>
                    {analytics.topVenue
                      ? `${analytics.topVenue.count} حجز بإجمالي ${formatCurrency(analytics.topVenue.revenue)} ج.م`
                      : "سيبدأ الترتيب مع أول الحجوزات"}
                  </small>
                </div>
              </div>

              <div className="owner-insight-card">
                <div className="owner-insight-icon">🔥</div>
                <div className="owner-insight-info">
                  <h4>ساعات الذروة (الأكثر ازدحامًا)</h4>
                  <p>{analytics.peakHoursText}</p>
                  <small>الوقت الذي يفضله معظم لاعبيك للحجز</small>
                </div>
              </div>
            </section>

            {/* 2. الرسم البياني التفاعلي: الحجوزات والإيراد (أسبوعي / شهري) */}
            <section className="owner-chart-card">
              <div className="owner-chart-header">
                <div className="owner-chart-title">
                  <span style={{ fontSize: 22 }}>📈</span>
                  <h3>رسم بياني للإيرادات والحجوزات</h3>
                </div>
                <div className="owner-chart-toggle">
                  <button
                    type="button"
                    className={`owner-chart-toggle-btn ${timeframe === "weekly" ? "active" : ""}`}
                    onClick={() => setTimeframe("weekly")}
                  >
                    آخر 7 أيام (أسبوعي)
                  </button>
                  <button
                    type="button"
                    className={`owner-chart-toggle-btn ${timeframe === "monthly" ? "active" : ""}`}
                    onClick={() => setTimeframe("monthly")}
                  >
                    آخر 6 أشهر
                  </button>
                </div>
              </div>

              <div className="owner-chart-wrapper">
                <div className="owner-chart-bars">
                  {currentChartData.map((item, idx) => {
                    const revHeightPercent = Math.max(
                      6,
                      Math.round((item.revenue / maxRevenue) * 100),
                    );
                    const bookHeightPercent = Math.max(
                      6,
                      Math.round((item.bookingsCount / maxBookings) * 100),
                    );

                    return (
                      <div
                        key={idx}
                        className={`owner-chart-col ${item.isToday ? "is-today" : ""}`}
                        title={`${item.label}: ${formatCurrency(item.revenue)} ج.م (${item.bookingsCount} حجز)`}
                      >
                        <div className="owner-chart-bar-group">
                          {/* عمود الإيرادات */}
                          <div
                            className="owner-chart-bar revenue"
                            style={{ height: `${item.revenue > 0 ? revHeightPercent : 4}%` }}
                          />
                          {/* عمود عدد الحجوزات */}
                          <div
                            className="owner-chart-bar bookings"
                            style={{ height: `${item.bookingsCount > 0 ? bookHeightPercent : 4}%` }}
                          />
                        </div>
                        <span className="owner-chart-label">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* دليل الألوان */}
              <div className="owner-chart-legend">
                <div className="owner-legend-item">
                  <div className="owner-legend-color rev" />
                  <span>الإيرادات (ج.م)</span>
                </div>
                <div className="owner-legend-item">
                  <div className="owner-legend-color bk" />
                  <span>عدد الحجوزات</span>
                </div>
              </div>
            </section>

            {/* 3. قسم سريع: حجوزات اليوم والقادمة */}
            <section className="owner-quick-section">
              <div className="owner-quick-header">
                <div className="owner-tabs-nav">
                  <button
                    type="button"
                    className={`owner-tab-nav-btn ${quickTab === "today" ? "active" : ""}`}
                    onClick={() => setQuickTab("today")}
                  >
                    حجوزات اليوم
                    <span className="owner-tab-badge">
                      {analytics.todayList.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`owner-tab-nav-btn ${quickTab === "upcoming" ? "active" : ""}`}
                    onClick={() => setQuickTab("upcoming")}
                  >
                    الحجوزات القادمة
                    <span className="owner-tab-badge">
                      {analytics.upcomingList.length}
                    </span>
                  </button>
                </div>
                <Link to="/owner/bookings" className="owner-btn secondary" style={{ fontSize: 13 }}>
                  عرض كل الحجوزات الكاملة ←
                </Link>
              </div>

              {quickTab === "today" ? (
                analytics.todayList.length === 0 ? (
                  <p className="owner-empty">
                    لا توجد أي حجوزات مجدولة لهذا اليوم حتى الآن.
                  </p>
                ) : (
                  <div className="owner-booking-cards-list">
                    {analytics.todayList.map((booking) => (
                      <article key={booking.id} className="owner-booking-quick-card">
                        <div className="owner-booking-quick-meta">
                          <span className="owner-time-pill">
                            {formatTime12(booking.start_time)} - {formatTime12(booking.end_time)}
                          </span>
                          <div>
                            <h4 className="owner-booking-quick-title">
                              {booking.venue?.name || `الملعب #${booking.venue_id}`}
                            </h4>
                            <div className="owner-booking-quick-player">
                              <span>اللاعب: {booking.player?.name || "مستخدم"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="owner-booking-quick-side">
                          <span className="owner-booking-price-tag">
                            {formatCurrency(booking.price)} ج.م
                          </span>
                          <span className={`owner-status ${booking.status}`}>
                            {statusLabels[booking.status] || booking.status}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                )
              ) : analytics.upcomingList.length === 0 ? (
                <p className="owner-empty">لا توجد حجوزات قادمة خلال الفترة القريبة.</p>
              ) : (
                <div className="owner-booking-cards-list">
                  {analytics.upcomingList.map((booking) => (
                    <article key={booking.id} className="owner-booking-quick-card">
                      <div className="owner-booking-quick-meta">
                        <span className="owner-time-pill" style={{ background: "var(--cream)", color: "var(--green-dark)" }}>
                          {booking.date} · {formatTime12(booking.start_time)}
                        </span>
                        <div>
                          <h4 className="owner-booking-quick-title">
                            {booking.venue?.name || `الملعب #${booking.venue_id}`}
                          </h4>
                          <div className="owner-booking-quick-player">
                            <span>اللاعب: {booking.player?.name || "مستخدم"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="owner-booking-quick-side">
                        <span className="owner-booking-price-tag">
                          {formatCurrency(booking.price)} ج.م
                        </span>
                        <span className={`owner-status ${booking.status}`}>
                          {statusLabels[booking.status] || booking.status}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* قائمة الملاعب المسجلة والتعديل السريع */}
            <section className="owner-panel">
              <div className="owner-panel-heading">
                <h2>ملاعبك المسجلة ({venues.length})</h2>
                <Link to="/owner/venues/new" className="owner-btn" style={{ fontSize: 13, minHeight: 36 }}>
                  + إضافة ملعب آخر
                </Link>
              </div>

              {venues.length === 0 ? (
                <p className="owner-empty">لم تقم بإضافة أي ملاعب حتى الآن.</p>
              ) : (
                <div style={{ display: "grid", gap: 14 }}>
                  {venues.map((venue) => (
                    <article
                      key={venue.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 16,
                        padding: "16px 20px",
                        borderRadius: 14,
                        background: "var(--bg)",
                        border: "1px solid var(--border)",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <h3 style={{ fontSize: 17, color: "var(--green)", fontWeight: 800 }}>
                          {venue.name}
                        </h3>
                        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
                          📍 {venue.address || venue.area || venue.city || "العنوان غير محدد"} · سعر الساعة: {venue.price_per_hour || 0} ج.م
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <Link
                          to={`/owner/venues/${venue.id}/edit`}
                          className="owner-btn secondary"
                          style={{ fontSize: 13, minHeight: 36, padding: "6px 16px" }}
                        >
                          تعديل البيانات
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
