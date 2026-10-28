
import { Routes, Route, Navigate } from "react-router-dom";

import Placeholder from "./components/Placeholder";
import MainLayout from "./components/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";

import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerBookings from "./pages/booking/OwnerBookings";

export default function App() {
  return (
    <Routes>
      {/* صفحات الدخول بدون Navbar */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* باقي الصفحات داخل Layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/venues" replace />} />

        {/* الصفحات العامة */}
        <Route path="/venues" element={<Placeholder name="الملاعب" />} />
        <Route
          path="/venues/:id"
          element={<Placeholder name="تفاصيل الملعب" />}
        />
        <Route
          path="/register-owner"
          element={<Placeholder name="تسجيل صاحب ملعب" />}
        />

        {/* أي مستخدم مسجل دخول */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Placeholder name="حسابي" />} />
        </Route>

        {/* اللاعب */}
        <Route element={<ProtectedRoute roles={["user"]} />}>
          <Route
            path="/book/:venueId"
            element={<Placeholder name="الحجز" />}
          />
          <Route
            path="/my-bookings"
            element={<Placeholder name="حجوزاتي" />}
          />
        </Route>

        {/* صاحب الملعب */}
        <Route element={<ProtectedRoute roles={["owner"]} />}>
          <Route
            path="/owner/dashboard"
            element={<OwnerDashboard />}
          />
          <Route
            path="/owner/bookings"
            element={<OwnerBookings />}
          />
          <Route
            path="/owner/venues/new"
            element={<Placeholder name="إضافة ملعب" />}
          />
          <Route
            path="/owner/venues/:id/edit"
            element={<Placeholder name="تعديل ملعب" />}
          />
        </Route>

        {/* الأدمن */}
        <Route element={<ProtectedRoute roles={["admin"]} />}>
          <Route
            path="/admin/dashboard"
            element={<Placeholder name="لوحة الأدمن" />}
          />
        </Route>
      </Route>
    </Routes>
  );
}
