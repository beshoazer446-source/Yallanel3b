import { Goal, SquareChevronRight, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { getInitials, isItemActive } from "./dashboardUtils";
import logoImage from "../../../Logo/Glossy Gold Soccer Ball Emblem.png";

// Sidebar عام: بياخد الأقسام من config، فنفس الكومبوننت يخدم الأونر والسوبر أدمن.
// مفيش فيه state خاص بيه، كل حاجة جاية من DashboardLayout.
export default function Sidebar({
  sections,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onClose,
  user,
  onLogout,
  brandName = "Yallanel3b",
  logo = logoImage,
}) {
  const { pathname } = useLocation();

  const className = [
    "dash-sidebar",
    collapsed ? "is-collapsed" : "",
    mobileOpen ? "is-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  function handleAction(item) {
    onClose();
    if (item.action === "logout") onLogout?.();
  }

  return (
    <aside className={className} aria-label="القائمة الجانبية">
      <div className="dash-sidebar-top">
        <div className="dash-brand">
          <span className="dash-logo">
            {logo ? (
              <img src={logo} alt="" />
            ) : (
              <Goal size={22} aria-hidden="true" />
            )}
          </span>
          <span className="dash-brand-name">{brandName}</span>
        </div>

        <button
          type="button"
          className="dash-collapse-btn"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "فتح القائمة الجانبية" : "طي القائمة الجانبية"}
        >
          <SquareChevronRight size={20} aria-hidden="true" />
        </button>

        <button
          type="button"
          className="dash-close-btn"
          onClick={onClose}
          aria-label="إغلاق القائمة"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <nav className="dash-nav" aria-label="التنقل الرئيسي">
        {sections.map((section) => (
          <div className="dash-section" key={section.title}>
            <p className="dash-section-title">{section.title}</p>

            {section.items.map((item) => {
              const Icon = item.icon;
              const content = (
                <>
                  <Icon size={20} aria-hidden="true" />
                  <span className="dash-nav-label">{item.label}</span>
                  {item.badge ? (
                    <span className="dash-nav-badge">{item.badge}</span>
                  ) : null}
                </>
              );

              // في الوضع المطوي الاسم بيختفي، فبنحط aria-label
              const ariaLabel = collapsed ? item.label : undefined;

              if (item.action) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    className="dash-nav-link"
                    data-label={item.label}
                    aria-label={ariaLabel}
                    onClick={() => handleAction(item)}
                  >
                    {content}
                  </button>
                );
              }

              const active = isItemActive(item, pathname);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`dash-nav-link${active ? " is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  aria-label={ariaLabel}
                  data-label={item.label}
                  onClick={onClose}
                >
                  {content}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="dash-user">
        <span className="dash-avatar" aria-hidden="true">
          {getInitials(user.name)}
        </span>
        <div className="dash-user-info">
          <span className="dash-user-name" title={user.name}>
            {user.name}
          </span>
        </div>
      </div>
    </aside>
  );
}
