
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import VenueCard from "../components/VenueCard";
import { getFeaturedVenues } from "../services/venuesService";
import "./HomePage.css";

const steps = [
  {
    number: "01",
    title: "اختار ملعبك",
    description: "ابحث عن الملاعب المتاحة وشوف الموقع والسعر ومواعيد العمل.",
  },
  {
    number: "02",
    title: "حدد الموعد",
    description: "اختار اليوم والساعة المناسبة، واعرف قيمة الحجز والعربون قبل الدفع.",
  },
  {
    number: "03",
    title: "ارفع إثبات التحويل",
    description: "حوّل العربون إلى الملعب وارفع صورة التحويل، ثم تابع حالة الطلب.",
  },
];

export default function HomePage() {
  const [featuredVenues, setFeaturedVenues] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [venuesError, setVenuesError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadFeaturedVenues() {
      try {
        setLoadingVenues(true);
        setVenuesError("");
        const venues = await getFeaturedVenues(3);
        if (isMounted) setFeaturedVenues(venues);
      } catch (error) {
        if (isMounted) {
          setVenuesError(error.message || "تعذر تحميل الملاعب.");
        }
      } finally {
        if (isMounted) setLoadingVenues(false);
      }
    }

    loadFeaturedVenues();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="home-page" dir="rtl">
      <section className="home-hero">
        <div className="home-hero-content">
          <p className="home-eyebrow">YALLANEL3B · حجز الملاعب أسهل</p>
          <h1>ملعبك الجاي،<br />على بُعد خطوات.</h1>
          <p className="home-hero-description">
            اكتشف ملاعب قريبة منك، احجز موعدك أونلاين، وتابع طلبك لحد ما صاحب
            الملعب يأكده.
          </p>
          <div className="home-hero-actions">
            <Link to="/venues" className="btn btn-primary">اكتشف الملاعب</Link>
            <Link to="/register-owner" className="home-secondary-link">عندك ملعب؟ سجّله معنا</Link>
          </div>
          <div className="home-hero-note">
            السعر والعربون وطرق الدفع بتظهر لك قبل إرسال طلب الحجز.
          </div>
        </div>
        <div className="home-hero-ball" aria-hidden="true"><MapPin size={82} strokeWidth={1.5} /></div>
      </section>

      <section className="home-section home-featured-venues">
        <div className="home-featured-heading">
          <div>
            <p className="home-eyebrow">استكشف الملاعب - Explore Football Fields</p>
            <h2>اعثر على الملعب المناسب لك واحجز مباراتك القادمة.</h2>
          </div>
          <Link to="/venues" className="home-featured-view-all">
            عرض الكل <ArrowLeft size={17} />
          </Link>
        </div>

        {loadingVenues ? (
          <p className="home-venues-message" role="status">جاري تحميل الملاعب...</p>
        ) : venuesError ? (
          <p className="home-venues-message home-venues-error" role="alert">{venuesError}</p>
        ) : featuredVenues.length === 0 ? (
          <p className="home-venues-message">لا توجد ملاعب متاحة حاليًا.</p>
        ) : (
          <div className="venues-grid home-featured-grid">
            {featuredVenues.slice(0, 3).map((venue) => (
              <VenueCard venue={venue} key={venue.id} />
            ))}
          </div>
        )}

        <Link to="/venues" className="btn btn-primary home-explore-all">
          استكشف جميع الملاعب - Explore All Fields
          <ArrowLeft size={18} />
        </Link>
      </section>

      <section className="home-section home-how">
        <p className="home-eyebrow">ببساطة</p>
        <h2>احجز ملعبك في 3 خطوات</h2>
        <div className="home-steps">
          {steps.map((step) => (
            <article className="home-step card" key={step.number}>
              <span className="home-step-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-owner-cta">
        <div>
          <p className="home-eyebrow">لأصحاب الملاعب</p>
          <h2>إدارتك وحجوزاتك في مكان واحد</h2>
          <p>
            أضف ملعبك، حدّد الأسعار والمواعيد وطرق الدفع، واستقبل طلبات الحجز
            وإثباتات التحويل من لوحة التحكم.
          </p>
          <small>عمولة المنصة 10% من إجمالي قيمة الحجز بعد الموافقة، وتُسجل كمستحقات للتحصيل اليدوي من الأونر.</small>
        </div>
        <Link to="/register-owner" className="btn btn-primary">أنشئ حساب أونر</Link>
      </section>
    </div>
  );
}
