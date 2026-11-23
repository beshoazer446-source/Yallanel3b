import { Banknote, CalendarCheck, CircleAlert, Clock3, Gauge, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Skeleton from "../../components/dashboard/ui/Skeleton";
import StatCard from "../../components/dashboard/ui/StatCard";
import ActionNeeded from "../../components/owner/overview/ActionNeeded";
import CourtsSnapshot from "../../components/owner/overview/CourtsSnapshot";
import OnboardingChecklist from "../../components/owner/overview/OnboardingChecklist";
import PeakHoursChart from "../../components/owner/overview/PeakHoursChart";
import RevenueChart from "../../components/owner/overview/RevenueChart";
import TodayBookings from "../../components/owner/overview/TodayBookings";
import {
  computeOverview,
  formatClock,
  formatMoney,
  getGreeting,
  getOnboardingSteps,
} from "../../components/owner/overview/overviewStats";
import "../../components/owner/overview/overview.css";
import { useAuth } from "../../context/useAuth";
import { PLATFORM_COMMISSION_PERCENT } from "../../lib/constants";
import { getOwnerOverviewData } from "../../services/ownerOverviewService";

function OverviewSkeleton() {
  return (
    <div className="overview" aria-busy="true" aria-label="جاري تحميل النظرة العامة">
      <div className="dash-stat-grid">
        {[0, 1, 2, 3].map((item) => (
          <Skeleton key={item} height={128} />
        ))}
      </div>
      <div className="overview-columns">
        <Skeleton height={300} />
        <Skeleton height={300} />
      </div>
      <Skeleton height={320} />
    </div>
  );
}

export default function OwnerOverviewPage() {
  const { user, profile } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [venueFilter, setVenueFilter] = useState("all");

  // التحميل بيتكرر لما reloadKey يتغير (زرار التحديث)
  useEffect(() => {
    let active = true;
    const requestedAt = new Date();

    getOwnerOverviewData(user.id, requestedAt)
      .then((result) => {
        if (!active) return;
        setData(result);
        setUpdatedAt(requestedAt);
        setError("");
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "تعذر تحميل بيانات النظرة العامة.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
        setRefreshing(false);
      });

    return () => {
      active = false;
    };
  }, [user.id, reloadKey]);

  function refresh() {
    setRefreshing(true);
    setError("");
    setReloadKey((current) => current + 1);
  }

  // لو الملعب المختار اتشال لأي سبب نرجع لـ "الكل"
  const effectiveFilter =
    data && data.venues.some((venue) => String(venue.id) === venueFilter) ? venueFilter : "all";

  const stats = useMemo(() => {
    if (!data || !updatedAt || data.venues.length === 0) return null;
    return computeOverview({
      venues: data.venues,
      bookings: data.bookings,
      workingHours: data.workingHours,
      venueId: effectiveFilter,
      today: updatedAt,
      commissionPercent: PLATFORM_COMMISSION_PERCENT,
    });
  }, [data, updatedAt, effectiveFilter]);

  const steps = useMemo(
    () =>
      data
        ? getOnboardingSteps({
            venues: data.venues,
            workingHours: data.workingHours,
            paymentMethods: data.paymentMethods,
          })
        : [],
    [data],
  );

  const firstName = (profile?.name || "").trim().split(/\s+/)[0];
  const now = updatedAt ?? new Date();
  const dateLabel = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);

  const showSkeleton = loading || (!data && refreshing);
  const multipleVenues = Boolean(data && data.venues.length > 1);
  const showVenueNames = multipleVenues && effectiveFilter === "all";
  const onboardingIncomplete = steps.some((step) => !step.done);

  return (
    <div className="overview">
      <div className="overview-top">
        <div>
          <h2 className="overview-greeting">
            {getGreeting(now)}
            {firstName ? ` يا ${firstName}` : ""}
          </h2>
          <p className="overview-date">{dateLabel}</p>
        </div>

        <div className="overview-controls">
          {multipleVenues ? (
            <select
              className="dash-input"
              aria-label="الملعب"
              value={effectiveFilter}
              onChange={(event) => setVenueFilter(event.target.value)}
            >
              <option value="all">كل الملاعب</option>
              {data.venues.map((venue) => (
                <option key={venue.id} value={String(venue.id)}>
                  {venue.name}
                </option>
              ))}
            </select>
          ) : null}

          <button
            type="button"
            className="dash-btn dash-btn-secondary"
            onClick={refresh}
            disabled={refreshing || loading}
          >
            <RefreshCw
              size={16}
              aria-hidden="true"
              className={refreshing ? "overview-spin" : undefined}
            />
            تحديث
          </button>
          {updatedAt ? (
            <span className="overview-updated">آخر تحديث {formatClock(updatedAt)}</span>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="dash-alert is-danger" role="alert">
          <CircleAlert size={18} aria-hidden="true" />
          <span>{error}</span>
          <button type="button" className="dash-btn dash-btn-secondary" onClick={refresh}>
            إعادة المحاولة
          </button>
        </div>
      ) : null}

      {showSkeleton ? <OverviewSkeleton /> : null}

      {!showSkeleton && data ? (
        <>
          {onboardingIncomplete ? <OnboardingChecklist steps={steps} /> : null}

          {stats ? (
            <>
              <div className="dash-stat-grid">
                <StatCard
                  icon={CalendarCheck}
                  label="حجوزات النهارده"
                  value={stats.todayCount}
                  hint={`أمس: ${stats.yesterdayCount}`}
                />
                <StatCard
                  icon={Banknote}
                  label="صافي إيرادات الشهر"
                  value={formatMoney(stats.monthNet)}
                  unit="ج.م"
                  delta={{
                    value: stats.netChangePercent,
                    label: "عن نفس الفترة الشهر اللي فات",
                  }}
                  hint={`الإجمالي قبل العمولة: ${formatMoney(stats.monthGross)} ج.م`}
                />
                <StatCard
                  icon={Clock3}
                  tone={stats.pendingCount > 0 ? "warning" : "default"}
                  label="حجوزات قيد المراجعة"
                  value={stats.pendingCount}
                  hint={stats.pendingCount > 0 ? "محتاجة ردك" : "مفيش طلبات معلقة"}
                />
                <StatCard
                  icon={Gauge}
                  label="نسبة الإشغال"
                  value={stats.occupancyPercent === null ? "—" : `${stats.occupancyPercent}%`}
                  progress={stats.occupancyPercent ?? undefined}
                  hint={
                    stats.occupancyPercent === null
                      ? "أضف مواعيد عمل لملعب مفعّل عشان تتحسب"
                      : `آخر 7 أيام · ${stats.bookedHours} من ${stats.availableHours} ساعة`
                  }
                />
              </div>

              <div className="overview-columns">
                <TodayBookings
                  todayList={stats.todayList}
                  upcomingList={stats.upcomingList}
                  today={now}
                  showVenue={showVenueNames}
                />
                <ActionNeeded
                  pendingList={stats.pendingList}
                  pendingCount={stats.pendingCount}
                  hiddenVenues={stats.hiddenVenues}
                  today={now}
                  showVenue={showVenueNames}
                />
              </div>

              <div className="overview-charts">
                <RevenueChart data7={stats.revenue7} data30={stats.revenue30} />
                <PeakHoursChart data={stats.peakHours} />
              </div>

              {multipleVenues ? (
                <CourtsSnapshot cards={stats.venueCards} topVenue={stats.topVenue} />
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
