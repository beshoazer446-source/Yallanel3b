import { Routes, Route } from "react-router-dom";
import Placeholder from "./components/Placeholder";

export default function App() {
  return (
    <Routes>
      {/* شخص 1 */}
      <Route path="/login" element={<Placeholder name="تسجيل الدخول" />} />
      <Route path="/register" element={<Placeholder name="تسجيل مستخدم" />} />

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
      <Route path="/book/:venueId" element={<Placeholder name="الحجز" />} />

      {/* شخص 4 */}
      <Route
        path="/owner/dashboard"
        element={<Placeholder name="لوحة الأونر" />}
      />
      <Route
        path="/owner/bookings"
        element={<Placeholder name="إدارة الحجوزات" />}
      />

      {/* شخص 5 */}
      <Route path="/venues" element={<Placeholder name="الملاعب" />} />
      <Route
        path="/venues/:id"
        element={<Placeholder name="تفاصيل الملعب" />}
      />
      <Route path="/my-bookings" element={<Placeholder name="حجوزاتي" />} />
      <Route path="/profile" element={<Placeholder name="حسابي" />} />
    </Routes>
  );
}
