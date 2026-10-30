import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PAYMENT_METHODS } from "../../lib/constants";
import { getVenueBookingInfo, getVenueById } from "../../services/venuesService";
import "./VenueDetailsPage.css";

const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export default function VenueDetailsPage() {
  const { id } = useParams();
  const [venue, setVenue] = useState(null);
  const [bookingInfo, setBookingInfo] = useState({ workingHours: [], paymentMethods: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    return <div className="container" style={{ padding: 24 }}>جاري تحميل تفاصيل الملعب...</div>;
  }

  if (error || !venue) {
    return (
      <div className="container" style={{ padding: 24 }}>
        <p role={error ? "alert" : undefined} style={{ color: error ? "var(--status-cancelled)" : "inherit" }}>
          {error || "عذرًا، هذا الملعب غير موجود أو غير متاح."}
        </p>
        <Link to="/venues" style={{ display: "inline-block", marginTop: 16, color: "var(--green)" }}>العودة لقائمة الملاعب</Link>
      </div>
    );
  }

  return (
    <section className="container venue-details-page" dir="rtl" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <Link to="/venues" className="btn btn-outline" style={{ marginBottom: 20, color: "var(--green)", borderColor: "var(--green)" }}>
        العودة لقائمة الملاعب
      </Link>
      <article className="card venue-details-card" style={{ padding: 24 }}>
        {venue.images?.length > 0 && (
          <div className="venue-details-gallery">
            {venue.images.map((image, index) => (
              <img
                key={image.id}
                src={image.image_url}
                alt={`صورة ${venue.name} ${index + 1}`}
              />
            ))}
          </div>
        )}
        <h1 style={{ color: "var(--green)" }}>{venue.name}</h1>
        <p style={{ color: "var(--text-muted)", marginTop: 8 }}>
          {[venue.city, venue.area, venue.address].filter(Boolean).join("، ") || "العنوان غير متوفر"}
        </p>
        {venue.description && <p style={{ lineHeight: 1.8, marginTop: 16 }}>{venue.description}</p>}

        <div style={{ margin: "20px 0", padding: 16, background: "var(--bg)", borderRadius: 10 }}>
          <p><strong>سعر الساعة:</strong> {venue.price_per_hour} ج.م</p>
          <p style={{ marginTop: 8 }}><strong>مدة الحجز:</strong> {venue.slot_minutes} دقيقة</p>
        </div>

        {Array.isArray(venue.amenities) && venue.amenities.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: 18 }}>مميزات الملعب</h2>
            <ul style={{ paddingRight: 20, marginTop: 8 }}>
              {venue.amenities.map((amenity) => <li key={amenity} style={{ marginBottom: 5 }}>{amenity}</li>)}
            </ul>
          </div>
        )}

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18 }}>مواعيد العمل</h2>
          {bookingInfo.workingHours.length === 0 ? (
            <p style={{ color: "var(--text-muted)", marginTop: 8 }}>لم تُحدد مواعيد العمل بعد.</p>
          ) : (
            <ul style={{ paddingRight: 20, marginTop: 8 }}>
              {bookingInfo.workingHours.map((hours, index) => (
                <li key={`${hours.day_of_week}-${hours.open_time}-${index}`} style={{ marginBottom: 6 }}>
                  {dayNames[hours.day_of_week]}: {hours.open_time.slice(0, 5)} - {hours.close_time.slice(0, 5)}
                </li>
              ))}
            </ul>
          )}
        </section>

        {bookingInfo.paymentMethods.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 18 }}>طرق الدفع</h2>
            <ul style={{ paddingRight: 20, marginTop: 8 }}>
              {bookingInfo.paymentMethods.map((method) => (
                <li key={`${method.method}-${method.account}`} style={{ marginBottom: 6 }}>
                  {PAYMENT_METHODS[method.method] || method.method}: {method.account}
                </li>
              ))}
            </ul>
          </section>
        )}

        {venue.maps_url && (
          <a href={venue.maps_url} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 20, color: "var(--green)", fontWeight: 700 }}>
            افتح الموقع على الخريطة
          </a>
        )}
        <div style={{ marginTop: 24 }}>
          <Link to={`/book/${venue.id}`} className="btn btn-primary">احجز الملعب</Link>
        </div>
      </article>
    </section>
  );
}
