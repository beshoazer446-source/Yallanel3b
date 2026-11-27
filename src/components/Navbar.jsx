import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CalendarDays,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  Moon,
  Plus,
  Sun,
  User,
  UserPlus,
  X,
  LifeBuoy,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logoImage from "../../Logo/Glossy Gold Soccer Ball Emblem.png";
import { useAuth } from "../context/useAuth";
import { useTheme } from "../context/useTheme";
import "./Navbar.css";

export default function Navbar() {
  const { user, profile, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [error, setError] = useState("");

  const role = profile?.role;
  const displayName = profile?.name ?? user?.email ?? "";
  const homePath =
    role === "owner"
      ? "/owner/dashboard"
      : role === "super_admin"
        ? "/admin/dashboard"
        : "/";
  const homeLabel =
    role === "owner" || role === "super_admin" ? "لوحة التحكم" : "الرئيسية";
  const bookingsPath = role === "owner" ? "/owner/bookings" : "/my-bookings";
  const bookingsLabel = role === "owner" ? "حجوزات ملعبي" : "حجوزاتي";
  const isLoggedIn = !loading && Boolean(user);

  useEffect(() => {
    if (!menuOpen) return undefined;

    function handleOutsideClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  async function handleSignOut() {
    setError("");
    setMenuOpen(false);
    try {
      await signOut();
      navigate("/login");
      setMobileOpen(false);
    } catch (signOutError) {
      setError(signOutError.message || "تعذر تسجيل الخروج.");
    }
  }

  function closeMenus() {
    setMenuOpen(false);
    setMobileOpen(false);
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link
          to={isLoggedIn ? homePath : "/"}
          className="navbar-logo"
          onClick={closeMenus}
        >
          <img src={logoImage} alt="" className="navbar-logo-img" />
          يلا نلعب
        </Link>

        <nav className="navbar-links" aria-label="التنقل الرئيسي">
          {isLoggedIn ? (
            <>
              <NavLink to={homePath} end onClick={closeMenus}>
                {homeLabel}
              </NavLink>
              <NavLink to="/venues" onClick={closeMenus}>
                استكشف الملاعب
              </NavLink>
              {(role === "user" || role === "owner") && (
                <NavLink to={bookingsPath} onClick={closeMenus}>
                  {bookingsLabel}
                </NavLink>
              )}
              {role === "user" && (
                <NavLink to="/support" onClick={closeMenus}>
                  الدعم
                </NavLink>
              )}
              {role === "super_admin" && (
                <NavLink to="/admin/dashboard" onClick={closeMenus}>
                  لوحة الأدمن
                </NavLink>
              )}
            </>
          ) : (
            <>
              <NavLink to="/" end onClick={closeMenus}>
                <Home size={17} /> الرئيسية
              </NavLink>
              <NavLink to="/venues" onClick={closeMenus}>
                استكشف الملاعب
              </NavLink>
            </>
          )}
        </nav>

        <div className="navbar-actions">
          <button
            type="button"
            className="navbar-theme"
            onClick={toggleTheme}
            aria-label={
              theme === "dark"
                ? "التبديل إلى الوضع الفاتح"
                : "التبديل إلى الوضع الداكن"
            }
            title={theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {loading ? null : user ? (
            <>
              {role === "owner" && (
                <Link
                  to="/owner/venues/new"
                  className="btn btn-primary navbar-add"
                >
                  <Plus size={17} /> إضافة ملعب
                </Link>
              )}
              <Link
                to="/notifications"
                className="navbar-icon-btn"
                aria-label="الإشعارات"
                title="الإشعارات"
              >
                <Bell size={19} aria-hidden="true" />
              </Link>
              <div className="navbar-profile" ref={menuRef}>
                <button
                  type="button"
                  className="navbar-profile-btn"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <span className="navbar-avatar">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="navbar-profile-name">{displayName}</span>
                  <span className="navbar-caret" aria-hidden="true">
                    ▾
                  </span>
                </button>
                {menuOpen && (
                  <div className="navbar-dropdown" role="menu">
                    <Link to="/profile" role="menuitem" onClick={closeMenus}>
                      الملف الشخصي
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                    >
                      تسجيل الخروج
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="btn btn-outline"
                onClick={closeMenus}
              >
                <LogIn size={17} /> تسجيل الدخول
              </Link>
              <Link
                to="/register"
                className="btn btn-primary"
                onClick={closeMenus}
              >
                <UserPlus size={17} /> إنشاء حساب
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="navbar-mobile-toggle"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "إغلاق قائمة التنقل" : "فتح قائمة التنقل"}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <nav className="navbar-mobile-menu" aria-label="قائمة التنقل للجوال">
          {isLoggedIn ? (
            <>
              <NavLink to={homePath} end onClick={closeMenus}>
                <LayoutDashboard size={18} /> {homeLabel}
              </NavLink>
              <NavLink to="/venues" onClick={closeMenus}>
                <MapPin size={18} /> استكشف الملاعب
              </NavLink>
              {(role === "user" || role === "owner") && (
                <NavLink to={bookingsPath} onClick={closeMenus}>
                  <CalendarDays size={18} /> {bookingsLabel}
                </NavLink>
              )}
              {role === "user" && (
                <NavLink to="/support" onClick={closeMenus}>
                  <LifeBuoy size={18} /> الدعم
                </NavLink>
              )}
              {role === "super_admin" && (
                <NavLink to="/admin/dashboard" onClick={closeMenus}>
                  <LayoutDashboard size={18} /> لوحة الأدمن
                </NavLink>
              )}
              <NavLink to="/profile" onClick={closeMenus}>
                <User size={18} /> {displayName}
              </NavLink>
              {role === "owner" && (
                <NavLink to="/owner/venues/new" onClick={closeMenus}>
                  <Plus size={18} /> إضافة ملعب
                </NavLink>
              )}
              <NavLink to="/notifications" onClick={closeMenus}>
                <Bell size={18} /> الإشعارات
              </NavLink>
              <button type="button" onClick={handleSignOut}>
                <LogOut size={18} /> تسجيل الخروج
              </button>
            </>
          ) : (
            <>
              <NavLink to="/" end onClick={closeMenus}>
                <Home size={18} /> الرئيسية
              </NavLink>
              <NavLink to="/venues" onClick={closeMenus}>
                <MapPin size={18} /> الملاعب
              </NavLink>
              <NavLink to="/login" onClick={closeMenus}>
                <LogIn size={18} /> تسجيل الدخول
              </NavLink>
              <NavLink to="/register" onClick={closeMenus}>
                <UserPlus size={18} /> إنشاء حساب
              </NavLink>
            </>
          )}
          <button type="button" onClick={toggleTheme}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            {theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
          </button>
        </nav>
      )}

      <nav className="mobile-action-dock" aria-label="اختصارات سريعة">
        {user ? (
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="تسجيل الخروج"
          >
            <LogOut size={20} aria-hidden="true" />
            <span>خروج</span>
          </button>
        ) : (
          <NavLink to="/login" aria-label="تسجيل الدخول">
            <LogIn size={20} aria-hidden="true" />
            <span>دخول</span>
          </NavLink>
        )}
        <NavLink to="/venues" aria-label="الملاعب">
          <MapPin size={20} aria-hidden="true" />
          <span>ملاعب</span>
        </NavLink>
        <NavLink
          to={
            role === "owner"
              ? "/owner/bookings"
              : role === "super_admin"
                ? "/admin/dashboard"
                : "/my-bookings"
          }
          aria-label={
            role === "owner"
              ? "حجوزات ملعبي"
              : role === "super_admin"
                ? "لوحة الأدمن"
                : "حجوزاتي"
          }
        >
          <CalendarDays size={20} aria-hidden="true" />
          <span>
            {role === "owner"
              ? "حجوزات"
              : role === "super_admin"
                ? "الإدارة"
                : "حجوزاتي"}
          </span>
        </NavLink>
        <NavLink to="/profile" aria-label="الملف الشخصي">
          <User size={20} aria-hidden="true" />
          <span>حسابي</span>
        </NavLink>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={
            theme === "dark"
              ? "التبديل إلى الوضع الفاتح"
              : "التبديل إلى الوضع الداكن"
          }
        >
          {theme === "dark" ? (
            <Sun size={20} aria-hidden="true" />
          ) : (
            <Moon size={20} aria-hidden="true" />
          )}
          <span>{theme === "dark" ? "فاتح" : "داكن"}</span>
        </button>
      </nav>
      {error && (
        <p role="alert" className="navbar-error">
          {error}
        </p>
      )}
    </header>
  );
}
