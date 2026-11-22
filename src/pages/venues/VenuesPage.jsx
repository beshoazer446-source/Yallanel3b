import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Compass,
  LocateFixed,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { getVenues } from "../../services/venuesService";
import VenueCard from "../../components/VenueCard";
import { calculateHaversineDistance, extractVenueCoordinates } from "../../utils/geoUtils";
import { EGYPT_LOCATIONS, GOVERNORATES } from "../../data/egyptLocations";
import "./VenuesPage.css";

const GEO_STORAGE_KEY = "yallanel3b_user_geo";
const FILTERS_STORAGE_KEY = "yallanel3b_venues_filters";

function getInitialGeo() {
  try {
    const raw = localStorage.getItem(GEO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getInitialFilters() {
  try {
    const raw = sessionStorage.getItem(FILTERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function VenuesPage() {
  const initialGeo = useMemo(() => getInitialGeo(), []);
  const initialFilters = useMemo(() => getInitialFilters(), []);

  const [venues, setVenues] = useState([]);
  const [searchTerm, setSearchTerm] = useState(initialFilters?.searchTerm || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // حالات الموقع الجغرافي (Geolocation) مع الحفظ التلقائي في المتصفح
  const [userCoords, setUserCoords] = useState(initialGeo?.coords || null);
  const [isLocating, setIsLocating] = useState(false);
  const [sortByNearest, setSortByNearest] = useState(Boolean(initialGeo?.sortByNearest));
  const [locationError, setLocationError] = useState("");

  // حالات فلترة المحافظة والمدينة المحفوظة
  const [selectedGovs, setSelectedGovs] = useState(initialFilters?.selectedGovs || []);
  const [selectedCities, setSelectedCities] = useState(initialFilters?.selectedCities || []);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // مزامنة الفلاتر في sessionStorage حتى تظل محفوظة عند التنقل بين الصفحات
  useEffect(() => {
    try {
      if (searchTerm || selectedGovs.length > 0 || selectedCities.length > 0) {
        sessionStorage.setItem(
          FILTERS_STORAGE_KEY,
          JSON.stringify({ searchTerm, selectedGovs, selectedCities })
        );
      } else {
        sessionStorage.removeItem(FILTERS_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [searchTerm, selectedGovs, selectedCities]);

  // جلب الملاعب عند تحميل الصفحة
  useEffect(() => {
    let isMounted = true;

    async function loadVenues() {
      try {
        setLoading(true);
        setError("");
        const results = await getVenues();
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
  }, []);

  // طلب الموقع الجغرافي عند الضغط على زر "الأقرب إليّ" (غير إجباري)
  function handleToggleNearest() {
    if (sortByNearest) {
      setSortByNearest(false);
      setUserCoords(null);
      try {
        localStorage.removeItem(GEO_STORAGE_KEY);
      } catch {
        // ignore
      }
      return;
    }

    if (userCoords) {
      setSortByNearest(true);
      setLocationError("");
      try {
        localStorage.setItem(
          GEO_STORAGE_KEY,
          JSON.stringify({ coords: userCoords, sortByNearest: true })
        );
      } catch {
        // ignore
      }
      return;
    }

    if (!navigator.geolocation) {
      setLocationError("متصفحك لا يدعم تحديد الموقع الجغرافي.");
      return;
    }

    setIsLocating(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserCoords(coords);
        setSortByNearest(true);
        setIsLocating(false);
        try {
          localStorage.setItem(
            GEO_STORAGE_KEY,
            JSON.stringify({ coords, sortByNearest: true })
          );
        } catch {
          // ignore
        }
      },
      (err) => {
        setIsLocating(false);
        setSortByNearest(false);
        if (err.code === 1) {
          setLocationError("تم رفض إذن الوصول للموقع. يمكنك اختيار المحافظة والمدينة من الفلاتر أدناه.");
        } else {
          setLocationError("تعذر الحصول على موقعك الحالي. تأكد من تشغيل الـ GPS بالمتصفح.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  // تبديل اختيار محافظة
  function toggleGovernorate(gov) {
    setSelectedGovs((prev) => {
      const exists = prev.includes(gov);
      const updated = exists ? prev.filter((item) => item !== gov) : [...prev, gov];

      // إذا ألغينا محافظة، نزيل المدن المرتبطة بها من التحديد
      if (exists) {
        const govAreas = EGYPT_LOCATIONS[gov] || [];
        setSelectedCities((currentCities) =>
          currentCities.filter((city) => !govAreas.includes(city)),
        );
      }
      return updated;
    });
  }

  // تبديل اختيار مدينة/منطقة
  function toggleCity(city) {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((item) => item !== city) : [...prev, city],
    );
  }

  // مسح جميع الفلاتر والبحث
  function handleResetAll() {
    setSearchTerm("");
    setSelectedGovs([]);
    setSelectedCities([]);
    setSortByNearest(false);
    setUserCoords(null);
    setLocationError("");
    try {
      localStorage.removeItem(GEO_STORAGE_KEY);
      sessionStorage.removeItem(FILTERS_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  // استخراج المحافظات المتاحة ديناميكيًا من الملاعب المسجلة
  const availableGovernorates = useMemo(() => {
    const govsInVenues = new Set();
    venues.forEach((v) => {
      if (v.city) govsInVenues.add(v.city.trim());
    });
    // ترتيب المحافظات: المتاحة أولاً ثم باقي المحافظات الشهيرة
    const all = Array.from(govsInVenues);
    GOVERNORATES.forEach((g) => {
      if (!govsInVenues.has(g)) all.push(g);
    });
    return all;
  }, [venues]);

  // استخراج المدن/المناطق المتاحة بناءً على المحافظات المختارة أو الملاعب المسجلة
  const availableCities = useMemo(() => {
    if (selectedGovs.length > 0) {
      const cities = new Set();
      selectedGovs.forEach((gov) => {
        const areas = EGYPT_LOCATIONS[gov] || [];
        areas.forEach((a) => cities.add(a));
      });
      // إضافة أي مناطق في الداتابيز تنتمي لنفس المحافظات
      venues.forEach((v) => {
        if (selectedGovs.includes(v.city?.trim()) && v.area) {
          cities.add(v.area.trim());
        }
      });
      return Array.from(cities);
    }

    // إذا لم تُحدد أي محافظة، نعرض المناطق الموجودة في الملاعب الحالية
    const areasInVenues = new Set();
    venues.forEach((v) => {
      if (v.area) areasInVenues.add(v.area.trim());
    });
    return Array.from(areasInVenues);
  }, [venues, selectedGovs]);

  // حساب المسافات، الفلترة الذكية، والترتيب
  const filteredAndSortedVenues = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    // 1. حساب المسافة لكل ملعب إذا توفرت إحداثيات المستخدم
    const venuesWithDistance = venues.map((venue) => {
      if (!userCoords) return venue;
      const coords = extractVenueCoordinates(venue);
      if (!coords) return { ...venue, distanceKm: null };
      const distanceKm = calculateHaversineDistance(
        userCoords.lat,
        userCoords.lng,
        coords.lat,
        coords.lng,
      );
      return { ...venue, distanceKm };
    });

    // 2. تطبيق فلاتر البحث النصي + المحافظة + المدينة
    let filtered = venuesWithDistance.filter((venue) => {
      // فلتر البحث النصي
      if (term) {
        const matchesSearch = [venue.name, venue.city, venue.area, venue.address, venue.description]
          .filter(Boolean)
          .some((val) => val.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }

      // فلتر المحافظة (واحد أو أكثر)
      if (selectedGovs.length > 0) {
        if (!venue.city || !selectedGovs.includes(venue.city.trim())) {
          return false;
        }
      }

      // فلتر المدينة/المنطقة (واحد أو أكثر)
      if (selectedCities.length > 0) {
        if (!venue.area || !selectedCities.includes(venue.area.trim())) {
          return false;
        }
      }

      return true;
    });

    // 3. الترتيب: حسب الأقرب جغرافياً أو الترتيب الافتراضي
    if (sortByNearest && userCoords) {
      filtered = [...filtered].sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm == null) return 0;
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    return filtered;
  }, [venues, searchTerm, selectedGovs, selectedCities, sortByNearest, userCoords]);

  // إحصائيات الفلاتر النشطة
  const activeFiltersCount =
    (selectedGovs.length > 0 ? selectedGovs.length : 0) +
    (selectedCities.length > 0 ? selectedCities.length : 0) +
    (sortByNearest ? 1 : 0) +
    (searchTerm.trim() ? 1 : 0);

  return (
    <main className="venues-page" dir="rtl">
      {/* قسم الهيدر والبحث الحالي (الحفاظ عليه بالكامل كما هو) */}
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
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="مسح البحث"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* قسم النتائج والفلاتر الذكية */}
      <section className="venues-results">
        {/* شريط التحكم بالفلاتر والترتيب الجغرافي */}
        <div className="venues-controls-bar">
          <div className="venues-controls-actions">
            {/* زر الأقرب إليّ */}
            <button
              type="button"
              className={`venues-control-btn geo-btn ${sortByNearest ? "is-active" : ""}`}
              onClick={handleToggleNearest}
              disabled={isLocating}
              aria-pressed={sortByNearest}
            >
              {isLocating ? (
                <>
                  <Compass size={18} className="spin-icon" />
                  <span>جاري تحديد موقعك...</span>
                </>
              ) : sortByNearest ? (
                <>
                  <LocateFixed size={18} />
                  <span>الأقرب إليك أولاً</span>
                  <span className="control-active-dot" />
                </>
              ) : (
                <>
                  <Compass size={18} />
                  <span>الأقرب إليّ</span>
                </>
              )}
            </button>

            {/* زر فتح بانل تصفية المحافظة والمدينة */}
            <button
              type="button"
              className={`venues-control-btn filter-toggle-btn ${isFilterOpen || selectedGovs.length > 0 || selectedCities.length > 0 ? "is-active" : ""}`}
              onClick={() => setIsFilterOpen((prev) => !prev)}
              aria-expanded={isFilterOpen}
            >
              <SlidersHorizontal size={18} />
              <span>المحافظة والمدينة</span>
              {(selectedGovs.length > 0 || selectedCities.length > 0) && (
                <span className="control-badge">
                  {selectedGovs.length + selectedCities.length}
                </span>
              )}
            </button>

            {/* زر مسح الفلاتر السريع عند تفعيل أي فلتر */}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                className="venues-reset-btn"
                onClick={handleResetAll}
                title="إعادة ضبط ومسح كل الفلاتر"
              >
                <RotateCcw size={15} />
                <span>مسح الفلاتر ({activeFiltersCount})</span>
              </button>
            )}
          </div>

          {/* تنبيه في حال رفض إذن الموقع */}
          {locationError && (
            <div className="venues-geo-error" role="status">
              <AlertCircle size={16} />
              <span>{locationError}</span>
              <button
                type="button"
                onClick={() => setLocationError("")}
                aria-label="إغلاق التنبيه"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* بانل الفلاتر العصرية (Custom Checkboxes & Filter Pills) */}
        {isFilterOpen && (
          <div className="venues-filter-panel">
            <div className="venues-filter-panel-header">
              <h3>
                <SlidersHorizontal size={18} />
                <span>تصفية بالمحافظة والمدينة</span>
              </h3>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {(selectedGovs.length > 0 || selectedCities.length > 0) && (
                  <button
                    type="button"
                    className="panel-clear-btn"
                    onClick={() => {
                      setSelectedGovs([]);
                      setSelectedCities([]);
                    }}
                  >
                    مسح التحديد
                  </button>
                )}
                <button
                  type="button"
                  className="panel-close-btn"
                  onClick={() => setIsFilterOpen(false)}
                  aria-label="إغلاق قائمة الفلاتر"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* قسم المحافظات */}
            <div className="venues-filter-group">
              <div className="venues-filter-group-header">
                <span className="filter-group-title">المحافظة:</span>
                {selectedGovs.length > 0 && (
                  <span className="filter-group-count">
                    {selectedGovs.length} مختارة
                  </span>
                )}
              </div>
              <div className="venues-checkbox-pills">
                {availableGovernorates.map((gov) => {
                  const isChecked = selectedGovs.includes(gov);
                  const venueCount = venues.filter((v) => v.city?.trim() === gov).length;

                  return (
                    <label
                      key={gov}
                      className={`venues-custom-checkbox-pill ${isChecked ? "is-checked" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleGovernorate(gov)}
                      />
                      <span className="custom-check-box">
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </span>
                      <span className="pill-text">{gov}</span>
                      {venueCount > 0 && (
                        <span className="pill-count">{venueCount}</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* قسم المدن / المناطق */}
            {availableCities.length > 0 && (
              <div className="venues-filter-group" style={{ marginTop: 18 }}>
                <div className="venues-filter-group-header">
                  <span className="filter-group-title">
                    المدينة / المنطقة {selectedGovs.length > 0 ? `(التابعة للمحافظات المختارة)` : ""}:
                  </span>
                  {selectedCities.length > 0 && (
                    <span className="filter-group-count">
                      {selectedCities.length} مختارة
                    </span>
                  )}
                </div>
                <div className="venues-checkbox-pills">
                  {availableCities.map((city) => {
                    const isChecked = selectedCities.includes(city);
                    const venueCount = venues.filter(
                      (v) => v.area?.trim() === city,
                    ).length;

                    return (
                      <label
                        key={city}
                        className={`venues-custom-checkbox-pill ${isChecked ? "is-checked" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCity(city)}
                        />
                        <span className="custom-check-box">
                          {isChecked && <Check size={12} strokeWidth={3} />}
                        </span>
                        <span className="pill-text">{city}</span>
                        {venueCount > 0 && (
                          <span className="pill-count">{venueCount}</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* شارات الفلاتر النشطة القابلة للإزالة (Active Tags) */}
        {(selectedGovs.length > 0 || selectedCities.length > 0 || sortByNearest) && (
          <div className="venues-active-tags-bar">
            {sortByNearest && (
              <span className="active-tag-chip">
                <span>📍 الأقرب إليك</span>
                <button
                  type="button"
                  onClick={() => {
                    setSortByNearest(false);
                    setUserCoords(null);
                    try {
                      localStorage.removeItem(GEO_STORAGE_KEY);
                    } catch {
                      // ignore
                    }
                  }}
                  aria-label="إلغاء الترتيب بالأقرب"
                >
                  <X size={13} />
                </button>
              </span>
            )}
            {selectedGovs.map((gov) => (
              <span key={gov} className="active-tag-chip">
                <span>محافظة: {gov}</span>
                <button
                  type="button"
                  onClick={() => toggleGovernorate(gov)}
                  aria-label={`إزالة فلتر ${gov}`}
                >
                  <X size={13} />
                </button>
              </span>
            ))}
            {selectedCities.map((city) => (
              <span key={city} className="active-tag-chip">
                <span>منطقة: {city}</span>
                <button
                  type="button"
                  onClick={() => toggleCity(city)}
                  aria-label={`إزالة فلتر ${city}`}
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* عنوان قسم النتائج مع عداد الملاعب الحي */}
        <div className="venues-results-heading">
          <div>
            <p className="venues-section-label">اختار ملعبك</p>
            <h2>الملاعب المتاحة</h2>
          </div>
          {!loading && (
            <span className="venues-count">
              {filteredAndSortedVenues.length === 0
                ? "لا توجد نتائج"
                : filteredAndSortedVenues.length === 1
                ? "ملعب واحد متاح"
                : `${filteredAndSortedVenues.length} ملاعب متاحة`}
            </span>
          )}
        </div>

        {/* حالة التحميل، الأخطاء، أو عرض شبكة الملاعب */}
        {loading ? (
          <p className="venues-message" role="status">
            جاري تحميل الملاعب...
          </p>
        ) : error ? (
          <p className="venues-message venues-error" role="alert">
            {error}
          </p>
        ) : filteredAndSortedVenues.length === 0 ? (
          <div className="venues-message venues-empty">
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
              لا توجد ملاعب تطابق خيارات البحث والفلاتر الحالية.
            </p>
            <p style={{ marginTop: 6, fontSize: 14 }}>
              جرّب إزالة بعض الفلاتر أو البحث باسم منطقة ومحافظة أخرى.
            </p>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleResetAll}
                style={{ marginTop: 14, fontSize: 13 }}
              >
                مسح كل الفلاتر وعرض جميع الملاعب
              </button>
            )}
          </div>
        ) : (
          <div className="venues-grid">
            {filteredAndSortedVenues.map((venue) => (
              <VenueCard venue={venue} key={venue.id} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
