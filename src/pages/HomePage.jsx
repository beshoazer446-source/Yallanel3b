import { Link } from "react-router-dom";
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
        <div className="home-hero-ball" aria-hidden="true">⚽</div>
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
