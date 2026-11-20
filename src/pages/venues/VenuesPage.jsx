
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { getVenues, searchVenues } from "../../services/venuesService";
import VenueCard from "../../components/VenueCard";
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
            <Search size={20} aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="ابحث باسم الملعب أو المنطقة..."
              aria-label="البحث عن ملعب"
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm("")} aria-label="مسح البحث">
                <X size={18} />
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
              <VenueCard venue={venue} key={venue.id} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
