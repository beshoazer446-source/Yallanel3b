
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getVenues, searchVenues } from "../../services/venuesService";
import "./VenuesPage.css";

export default function VenuesPage() {
  const [venues, setVenues] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadVenues() {
      try {
        setLoading(true);
        setError("");

        const results = searchTerm.trim()
          ? await searchVenues(searchTerm.trim())
          : await getVenues();

        if (isMounted) {
          setVenues(results);
        }
      } catch (err) {
        if (isMounted) {
          setError("حدث خطأ أثناء تحميل الملاعب.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadVenues();

    return () => {
      isMounted = false;
    };
  }, [searchTerm]);

  return (
    <main className="venues-page" dir="rtl">
      <section className="venues-header">
        <p className="venues-eyebrow">YALLANEL3B</p>
        <h1>اكتشف الملاعب</h1>
        <p>ابحث عن الملعب المناسب لك واعرف سعر الحجز وتفاصيله.</p>

        <div className="venues-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="ابحث باسم الملعب أو المنطقة..."
            aria-label="البحث عن ملعب"
          />
        </div>
      </section>

      <section className="venues-results">
        <div className="venues-results-heading">
          <h2>الملاعب المتاحة</h2>
          {!loading && <span>{venues.length} ملعب</span>}
        </div>

        {loading ? (
          <p className="venues-message">جاري تحميل الملاعب...</p>
        ) : error ? (
          <p className="venues-message venues-error">{error}</p>
        ) : venues.length === 0 ? (
          <p className="venues-message">
            لا توجد ملاعب تطابق بحثك. جرّب اسمًا أو منطقة أخرى.
          </p>
        ) : (
          <div className="venues-grid">
            {venues.map((venue) => (
              <article className="venue-card" key={venue.id}>
                <div className="venue-card-top">
                  <span className="venue-icon" aria-hidden="true">
                    ⚽
                  </span>
                  <span className="venue-city">
                    {venue.city || "الموقع غير محدد"}
                  </span>
                </div>

                <h3>{venue.name}</h3>

                <p className="venue-location">
                  <span aria-hidden="true">📍</span>{" "}
                  {venue.area || venue.address || "العنوان غير متوفر"}
                </p>

                {venue.description && (
                  <p className="venue-description">
                    {venue.description}
                  </p>
                )}

                <div className="venue-price">
                  <strong>{venue.price_per_hour} جنيه</strong>
                  <span> / ساعة</span>
                </div>

                {venue.amenities?.length > 0 && (
                  <div className="venue-amenities">
                    {venue.amenities.slice(0, 3).map((amenity) => (
                      <span key={amenity}>{amenity}</span>
                    ))}
                  </div>
                )}

                <Link
                  className="venue-details-link"
                  to={`/venues/${venue.id}`}
                >
                  عرض التفاصيل
                  <span aria-hidden="true"> ←</span>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
