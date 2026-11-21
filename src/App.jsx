import { Routes, Route } from "react-router-dom";
import OwnerRegister from "./components/OwnerRegister";
import AddVenue from "./components/AddVenue";
import EditVenue from "./components/EditVenue";
import Placeholder from "./components/Placeholder";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <Routes>
      {/* شخص 1 */}
      <Route path="/login" element={<Placeholder name="تسجيل الدخول" />} />
      <Route path="/register" element={<Placeholder name="تسجيل مستخدم" />} />

      {/* شخص 2 */}
      <Route path="/register-owner" element={<OwnerRegister />} />
      <Route path="/owner/venues/new" element={<AddVenue />} />
      <Route path="/owner/venues/:id/edit" element={<EditVenue />} />

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
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}