
import { Routes, Route } from "react-router-dom";
import Placeholder from "./components/Placeholder";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VenuesPage from "./pages/venues/VenuesPage";

export default function App() {
  return (
    <Routes>
      {/* شخص 1 */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/admin/dashboard"
        element={<Placeholder name="لوحة الأدمن" />}
      />

      {/* شخص 2 */}
      <Route
        path="/register-owner"
        element={<Placeholder name="تسجيل صاحب ملعب" />}
      />
      <Route
        path="/owner/venues/new"
        element={<Placeholder name="إضافة ملعب" />}
      />
      <Route
        path="/owner/venues/:id/edit"
        element={<Placeholder name="تعديل ملعب" />}
      />

      {/* شخص 3 */}
      <Route
        path="/book/:venueId"
        element={<Placeholder name="الحجز" />}
      />

      {/* شخص 4 */}
      <Route
        path="/owner/dashboard"
        element={<Placeholder name="لوحة الأونر" />}
      />
      <Route
        path="/owner/bookings"
        element={<Placeholder name="إدارة الحجوزات" />}
      />

      {/* شخص 5: عرض الملاعب والبحث */}
      <Route path="/venues" element={<VenuesPage />} />

      <Route
        path="/venues/:id"
        element={<Placeholder name="تفاصيل الملعب" />}
      />

      <Route
        path="/my-bookings"
        element={<Placeholder name="حجوزاتي" />}
      />
      <Route
        path="/profile"
        element={<Placeholder name="حسابي" />}
      />
    </Routes>
  );
}
