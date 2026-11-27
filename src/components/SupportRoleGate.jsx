import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

// بوابة مسارات /support*: روابط الإيميل بتشاور على /support/...
// فبنحوّل كل دور لواجهته: الأونر لـ /owner/support والأدمن لـ /admin/support.
// اللاعب بيكمل عادي. لازم تتحط جوه <ProtectedRoute /> (من غير roles).
export default function SupportRoleGate() {
  const { profile } = useAuth();
  const location = useLocation();
  const role = profile?.role;

  // "" أو "/new" أو "/<ticketId>"
  const suffix = location.pathname.replace(/^\/support/, "").replace(/\/+$/, "");

  if (role === "owner") {
    return <Navigate to={`/owner/support${suffix}${location.search}`} replace />;
  }

  if (role === "super_admin") {
    // الأدمن مالوش صفحة "تذكرة جديدة"
    const target = suffix === "/new" ? "" : suffix;
    return <Navigate to={`/admin/support${target}${location.search}`} replace />;
  }

  if (role !== "user") return <Navigate to="/" replace />;

  return <Outlet />;
}
