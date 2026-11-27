import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './Footer.css';

const Footer = () => {
  const { user, profile } = useAuth();
  const isOwner =
    user?.user_metadata?.role === 'owner' ||
    profile?.role === 'owner' ||
    profile?.is_owner === true;

  return (
    <footer className="footer" dir="rtl">
      <div className="footer-container">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            يلا نلعب
          </Link>
          <p className="footer-tagline">
            منصتك الأسهل لحجز ملاعب كرة القدم وتنظيم المباريات مع أصحابك.
          </p>
        </div>

        <div className="footer-links">
          <h4>روابط سريعة</h4>
          <ul>
            <li>
              <Link to="/">الرئيسية</Link>
            </li>
            <li>
              <Link to="/venues">الملاعب</Link>
            </li>

            {!user ? (
              <>
                <li>
                  <Link to="/login">تسجيل الدخول</Link>
                </li>
                <li>
                  <Link to="/register">إنشاء حساب</Link>
                </li>
              </>
            ) : isOwner ? (
              <>
                <li>
                  <Link to="/owner/dashboard">لوحة تحكم المالك</Link>
                </li>
                <li>
                  <Link to="/owner/venues">ملاعبي</Link>
                </li>
                <li>
                  <Link to="/owner/bookings">حجوزات الملاعب</Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/my-bookings">حجوزاتي</Link>
                </li>
                <li>
                  <Link to="/profile">الملف الشخصي</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} يلا نلعب. جميع الحقوق محفوظة.</p>
      </div>
    </footer>
  );
};

export default Footer;