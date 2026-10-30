
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
          setError(err.message || "حدث خطأ أثناء تحميل الملاعب.");
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
        <div className="venues-header-content">
          <p className="venues-eyebrow">YALLANEL3B</p>
          <h1>الماتش يبدأ من هنا</h1>
          <p>اكتشف ملاعب قريبة منك، قارن الأسعار، واحجز وقتك بسهولة.</p>

          <div className="venues-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="ابحث باسم الملعب أو المنطقة..."
              aria-label="البحث عن ملعب"
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm("")} aria-label="مسح البحث">
                ×
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="venues-results">
        <div className="venues-results-heading">
          <div>
            <p className="venues-section-label">اختار ملعبك</p>
            <h2>الملاعب المتاحة</h2>
          </div>
          {!loading && <span className="venues-count">{venues.length} ملعب</span>}
        </div>

        {loading ? (
          <p className="venues-message" role="status">جاري تحميل الملاعب...</p>
        ) : error ? (
          <p className="venues-message venues-error" role="alert">{error}</p>
        ) : venues.length === 0 ? (
          <p className="venues-message venues-empty">
            لا توجد ملاعب تطابق بحثك. جرّب اسمًا أو منطقة أخرى.
          </p>
        ) : (
          <div className="venues-grid">
            {venues.map((venue) => (
              <article className="venue-card" key={venue.id}>
                <div className="venue-card-image">
                  {venue.images?.[0]?.image_url ? (
                    <img src={venue.images[0].image_url} alt={`ملعب ${venue.name}`} />
                  ) : (
                    <div className="venue-image-placeholder" aria-hidden="true">
                      <span>⚽</span>
                      <span>ملعبك في انتظارك</span>
                    </div>
                  )}
                  <span className="venue-city">
                    {venue.city || "الموقع غير محدد"}
                  </span>
                </div>

                <div className="venue-card-content">
                  <h3>{venue.name}</h3>

                  <p className="venue-location">
                    <span aria-hidden="true">⌖</span>{" "}
                    {venue.area || venue.address || "العنوان غير متوفر"}
                  </p>

                  {venue.description && (
                    <p className="venue-description">{venue.description}</p>
                  )}

                  {venue.amenities?.length > 0 && (
                    <div className="venue-amenities">
                      {venue.amenities.slice(0, 3).map((amenity) => (
                        <span key={amenity}>{amenity}</span>
                      ))}
                    </div>
                  )}

                  <div className="venue-card-footer">
                    <div className="venue-price">
                      <strong>{venue.price_per_hour} <span>ج.م</span></strong>
                      <span> / ساعة</span>
                    </div>
                    <Link
                      className="venue-details-link"
                      to={`/venues/${venue.id}`}
                      aria-label={`عرض تفاصيل ${venue.name}`}
                    >
                      التفاصيل <span aria-hidden="true">←</span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
