import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Clock3, MapPin, Trophy } from "lucide-react";
import { PAYMENT_METHODS } from "../../lib/constants";
import { getVenueBookingInfo, getVenueById } from "../../services/venuesService";
import "./VenueDetailsPage.css";

const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function getDailyHours(workingHours) {
  const days = Array.from({ length: 7 }, () => []);
  workingHours.forEach((hours) => {
    const day = Number(hours.day_of_week);
    if (day >= 0 && day < days.length) {
      days[day].push({
        open: String(hours.open_time ?? "").slice(0, 5),
        close: String(hours.close_time ?? "").slice(0, 5),
      });
    }
  });
  return days;
}

function sameSchedule(first, second) {
  return first.length === second.length
    && first.every((period, index) => (
      period.open === second[index].open && period.close === second[index].close
    ));
}

function VenueHero({ venue }) {
  const image = venue.images?.find((item) => item.image_url)?.image_url;

  return (
    <>
      <div className="venue-details-hero">
        {image ? (
          <img src={image} alt={`ملعب ${venue.name}`} />
        ) : (
          <div className="venue-details-placeholder" aria-label="لا توجد صورة للملعب">
            <Trophy aria-hidden="true" />
            <span>ملعبك القادم يبدأ من هنا</span>
          </div>
        )}
        {venue.city && <span className="venue-details-city">{venue.city}</span>}
      </div>

      <header className="venue-details-heading">
        <h1>{venue.name}</h1>
        <p className="venue-details-location">
          <MapPin size={18} aria-hidden="true" />
          <span>{[venue.city, venue.area, venue.address].filter(Boolean).join("، ") || "العنوان غير متوفر"}</span>
        </p>
        {venue.description && <p className="venue-details-description">{venue.description}</p>}
      </header>
    </>
  );
}

function HoursGrid({ workingHours, today }) {
  const days = getDailyHours(workingHours);
  const allDaysHaveSameHours = days[0].length > 0
    && days.every((day) => sameSchedule(days[0], day));

  if (!workingHours.length) {
    return <p className="venue-details-muted">لم تُحدد مواعيد العمل بعد.</p>;
  }

  const scheduleCards = allDaysHaveSameHours
    ? [{ label: "كل الأيام", periods: days[0], isToday: false }]
    : days
      .map((periods, dayIndex) => ({
        label: dayNames[dayIndex],
        periods,
        isToday: dayIndex === today,
      }))
      .filter((day) => day.periods.length > 0);

  return (
    <div className="venue-hours-grid">
      {scheduleCards.map((day) => (
        <article
          key={day.label}
          className={`venue-hours-card${day.isToday ? " is-today" : ""}`}
        >
          <h3>{day.label}</h3>
          <div className="venue-hours-periods">
            {day.periods.map((period, index) => (
              <p key={`${period.open}-${period.close}-${index}`} dir="ltr">
                <Clock3 size={14} aria-hidden="true" />
                <span>{period.open} - {period.close}</span>
              </p>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function BookingCard({ venue }) {
  const price = Number(venue.price_per_hour);

  return (
    <aside className="venue-booking-card">
      <div className="venue-booking-price">
        <strong dir="ltr">{Number.isFinite(price) ? price.toLocaleString("en-US") : venue.price_per_hour} ج.م</strong>
        <span>/ ساعة</span>
      </div>
      <p className="venue-booking-duration">
        مدة الحجز: <strong>{venue.slot_minutes || 60} دقيقة</strong>
      </p>
      <Link to={`/book/${venue.id}`} className="btn btn-primary venue-booking-button">
        احجز الملعب
      </Link>
    </aside>
  );
}

export default function VenueDetailsPage() {
  const { id } = useParams();
  const [venue, setVenue] = useState(null);
  const [bookingInfo, setBookingInfo] = useState({ workingHours: [], paymentMethods: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [today] = useState(() => new Date().getDay());

  useEffect(() => {
    let active = true;

    async function fetchVenue() {
      try {
        setLoading(true);
        setError("");
        const [venueData, info] = await Promise.all([
          getVenueById(id),
          getVenueBookingInfo(id),
        ]);
        if (active) {
          setVenue(venueData);
          setBookingInfo(info);
        }
      } catch (loadError) {
        if (active) setError(loadError.message || "تعذر تحميل تفاصيل الملعب.");
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchVenue();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div className="container venue-details-state">جاري تحميل تفاصيل الملعب...</div>;
  }

  if (error || !venue) {
    return (
      <div className="container venue-details-state">
        <p role={error ? "alert" : undefined} className={error ? "venue-details-error" : ""}>
          {error || "عذرًا، هذا الملعب غير موجود أو غير متاح."}
        </p>
        <Link to="/venues" className="btn btn-outline venue-back-link">العودة لقائمة الملاعب</Link>
      </div>
    );
  }

  return (
    <section className="container venue-details-page" dir="rtl">
      <Link to="/venues" className="btn btn-outline venue-back-link">
        <ArrowRight size={17} aria-hidden="true" />
        العودة لقائمة الملاعب
      </Link>

      <div className="venue-details-layout">
        <main className="venue-details-main">
          <VenueHero venue={venue} />

          <section className="venue-details-section">
            <h2>مواعيد العمل</h2>
            <HoursGrid workingHours={bookingInfo.workingHours} today={today} />
          </section>

          {Array.isArray(venue.amenities) && venue.amenities.length > 0 && (
            <section className="venue-details-section">
              <h2>مميزات الملعب</h2>
              <ul className="venue-amenities-list">
                {venue.amenities.map((amenity) => <li key={amenity}>{amenity}</li>)}
              </ul>
            </section>
          )}

          {bookingInfo.paymentMethods.length > 0 && (
            <section className="venue-details-section">
              <h2>طرق الدفع المدعومة</h2>
              <div className="venue-payment-methods">
                {bookingInfo.paymentMethods.map((method) => (
                  <span key={method.method}>
                    {PAYMENT_METHODS[method.method] || method.method}
                  </span>
                ))}
              </div>
              <p className="venue-details-muted">
                يتم سداد العربون وتأكيد الحجز إلكترونيًا عبر المنصة لضمان حقك وحق صاحب الملعب.
              </p>
            </section>
          )}

          {venue.maps_url && (
            <a href={venue.maps_url} target="_blank" rel="noreferrer" className="venue-map-link">
              <MapPin size={17} aria-hidden="true" />
              افتح الموقع على الخريطة
            </a>
          )}
        </main>

        <BookingCard venue={venue} />
      </div>
    </section>
  );
}
