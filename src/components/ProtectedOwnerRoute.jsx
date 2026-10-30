
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedOwnerRoute({ children }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <p>جاري التحقق من الحساب...</p>;
  }

  console.log("Current user:", user?.id);
  console.log("Current profile role:", profile?.role);
  console.log("Current profile:", profile);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.role !== "owner") {
    return <Navigate to="/venues" replace />;
  }

  return children;
}
