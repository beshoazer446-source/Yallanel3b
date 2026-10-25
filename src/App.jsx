import "./index.css"
import "./App.css"
import { Routes, Route, Navigate } from "react-router-dom";
import Placeholder from "./components/Placeholder";
import MainLayout from "./components/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import BookingPage from "./pages/booking/BookingPage";
import BookingSuccess from "./pages/booking/BookingSuccess";

export default function App() {
  return (
    <Routes>
      {/* صفحات الدخول: من غير Navbar */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* باقي الصفحات: فيها Navbar */}
      <Route element={<MainLayout />}>
        {/* ===== صفحات مفتوحة لأي حد ===== */}
        <Route path="/" element={<Navigate to="/venues" replace />} />
        <Route path="/venues" element={<Placeholder name="الملاعب" />} />
        <Route
          path="/venues/:id"
          element={<Placeholder name="تفاصيل الملعب" />}
        />
        <Route
          path="/register-owner"
          element={<Placeholder name="تسجيل صاحب ملعب" />}
        />

        {/* ===== أي حد مسجّل دخول ===== */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Placeholder name="حسابي" />} />
        </Route>

        {/* ===== اللاعب بس ===== */}
        <Route element={<ProtectedRoute roles={["user"]} />}>
          <Route path="/book/:venueId" element={<BookingPage />} />
          <Route path="/booking-success" element={<BookingSuccess />} />
          <Route path="/my-bookings" element={<Placeholder name="حجوزاتي" />} />
        </Route>

        {/* ===== صاحب الملعب بس ===== */}
        <Route element={<ProtectedRoute roles={["owner"]} />}>
          <Route
            path="/owner/dashboard"
            element={<Placeholder name="لوحة الأونر" />}
          />
          <Route
            path="/owner/bookings"
            element={<Placeholder name="إدارة الحجوزات" />}
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

        {/* ===== الأدمن بس ===== */}
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
