import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer" dir="rtl">
      <div className="site-footer-content">
        <div>
          <Link to="/" className="site-footer-brand">يلا نلعب</Link>
          <p>منصة تساعدك تكتشف الملاعب وتحجز وقت لعبك بسهولة.</p>
        </div>
        <nav className="site-footer-links" aria-label="روابط سريعة">
          <Link to="/venues">الملاعب</Link>
          <Link to="/register-owner">لأصحاب الملاعب</Link>
          <Link to="/login">تسجيل الدخول</Link>
        </nav>
      </div>
      <div className="site-footer-bottom">
        <span>© يلا نلعب</span>
        <span>احجز ملعبك، واجمع فريقك.</span>
      </div>
    </footer>
  );
}
