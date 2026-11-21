import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homePath } from "../lib/homePath";

// roles: أنواع الحسابات المسموح لها (لو مفيش، أي حد مسجّل دخول يقدر يدخل)
export default function ProtectedRoute({ roles }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p style={{ padding: 24 }}>جاري التحميل...</p>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles) {
    // البروفايل ممكن يتأخر لحظة بعد الدخول
    if (!profile) return <p style={{ padding: 24 }}>جاري التحميل...</p>;
    if (!roles.includes(profile.role)) {
      return <Navigate to={homePath(profile.role)} replace />;
    }
  }

  return <Outlet />;
}
