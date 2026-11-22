import { Menu, Moon, Sun } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useTheme } from "../../context/useTheme";
import "../../dashboard.css";
import "../../dashboard-ui.css";
import Sidebar from "./Sidebar";
import { getPageTitle } from "./dashboardUtils";

const COLLAPSED_KEY = "dashboard-sidebar-collapsed";

function getInitialCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

// Layout عام للداشبوردات: sidebar + header + مكان المحتوى.
// الأونر والسوبر أدمن بيستخدموه بـ sections مختلفة.
export default function DashboardLayout({
  sections,
  extraTitles = [],
  brandName,
  logo,
}) {
  const { pathname } = useLocation();
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [collapsed, setCollapsed] = useState(getInitialCollapsed);

  // الـ drawer بنخزن فيه المسار اللي اتفتح عنده، فبيتقفل لوحده لما المسار يتغير
  const [drawerPath, setDrawerPath] = useState(null);
  const mobileOpen = drawerPath === pathname;

  const userName = profile?.name?.trim() || user?.email || "حسابي";
  const title = getPageTitle(pathname, sections, extraTitles);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, String(collapsed));
    } catch {
      // لو التخزين مش متاح مش مشكلة
    }
  }, [collapsed]);

  // لما الـ drawer يتفتح: نمنع سكرول الصفحة ونقفله بـ Esc
  useEffect(() => {
    if (!mobileOpen) return undefined;

    document.body.classList.add("dash-drawer-open");

    function handleKeyDown(event) {
      if (event.key === "Escape") setDrawerPath(null);
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("dash-drawer-open");
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  // لو الشاشة كبرت لـ 1024px وهو مفتوح نقفله
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");

    function handleChange(event) {
      if (event.matches) setDrawerPath(null);
    }

    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  async function handleLogout() {
    try {
      await signOut();
      // ProtectedRoute هيحوّل لـ /login لوحده بعد ما الـ user يبقى null
    } catch {
      // مؤقت: نستبدله برسالة Toast بعدين
      window.alert("تعذر تسجيل الخروج. حاول مرة أخرى.");
    }
  }

  return (
    <div className="dash-shell">
      <div
        className={`dash-overlay${mobileOpen ? " is-visible" : ""}`}
        onClick={() => setDrawerPath(null)}
        aria-hidden="true"
      />

      <Sidebar
        sections={sections}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((current) => !current)}
        mobileOpen={mobileOpen}
        onClose={() => setDrawerPath(null)}
        user={{ name: userName }}
        onLogout={handleLogout}
        brandName={brandName}
        logo={logo}
      />

      <div className="dash-main">
        <header className="dash-header">
          <button
            type="button"
            className="dash-menu-btn"
            onClick={() => setDrawerPath(pathname)}
            aria-label="فتح القائمة"
            aria-expanded={mobileOpen}
          >
            <Menu size={20} aria-hidden="true" />
          </button>

          <h1 className="dash-page-title">{title}</h1>

          <div className="dash-header-actions">
            <button
              type="button"
              className="dash-icon-btn"
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
            </button>
          </div>
        </header>

        <main className="dash-content">
          {/* Suspense هنا عشان الـ sidebar والهيدر يفضلوا ظاهرين وقت تحميل الصفحة */}
          <Suspense
            fallback={
              <p style={{ color: "var(--text-muted)" }}>جاري تحميل الصفحة...</p>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}