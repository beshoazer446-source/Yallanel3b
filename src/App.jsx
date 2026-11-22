import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./components/MainLayout";
import OwnerLayout from "./components/OwnerLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";

const HomePage = lazy(() => import("./pages/HomePage"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const OwnerRegistrationPage = lazy(
  () => import("./pages/auth/OwnerRegistrationPage"),
);
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const VenuesPage = lazy(() => import("./pages/venues/VenuesPage"));
const VenueDetailsPage = lazy(
  () => import("./pages/venues/VenueDetailsPage"),
);
const MyBookingsPage = lazy(() => import("./pages/venues/MyBookingsPage"));
const BookingPage = lazy(() => import("./pages/booking/BookingPage"));
const BookingSuccessPage = lazy(
  () => import("./pages/booking/BookingSuccessPage"),
);
const OwnerDashboardPage = lazy(
  () => import("./pages/owner/OwnerDashboardPage"),
);
const OwnerBookingsPage = lazy(
  () => import("./pages/owner/OwnerBookingsPage"),
);
const OwnerCalendarPage = lazy(
  () => import("./pages/owner/OwnerCalendarPage"),
);
const OwnerCourtsPage = lazy(() => import("./pages/owner/OwnerCourtsPage"));
const OwnerEarningsPage = lazy(
  () => import("./pages/owner/OwnerEarningsPage"),
);
const OwnerCustomersPage = lazy(
  () => import("./pages/owner/OwnerCustomersPage"),
);
const OwnerSettingsPage = lazy(
  () => import("./pages/owner/OwnerSettingsPage"),
);
const OwnerSupportPage = lazy(() => import("./pages/owner/OwnerSupportPage"));
const OwnerCourtFormPage = lazy(
  () => import("./pages/owner/OwnerCourtFormPage"),
);
const AdminDashboardPage = lazy(
  () => import("./pages/admin/AdminDashboardPage"),
);

export default function App() {
  return (
    <Suspense fallback={<p style={{ padding: 24 }}>جاري تحميل الصفحة...</p>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register-owner" element={<OwnerRegistrationPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/booking-success" element={<BookingSuccessPage />} />

        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/venues" element={<VenuesPage />} />
          <Route path="/venues/:id" element={<VenueDetailsPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route element={<ProtectedRoute roles={["user"]} />}>
            <Route path="/book/:venueId" element={<BookingPage />} />
            <Route path="/my-bookings" element={<MyBookingsPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          </Route>
        </Route>

        {/* داشبورد الأونر: layout خاص بيه (sidebar) بره MainLayout */}
        <Route element={<ProtectedRoute roles={["owner"]} />}>
          <Route path="/owner" element={<Navigate to="/owner/dashboard" replace />} />

          <Route element={<OwnerLayout />}>
            <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
            <Route path="/owner/bookings" element={<OwnerBookingsPage />} />
            <Route path="/owner/calendar" element={<OwnerCalendarPage />} />
            <Route path="/owner/courts" element={<OwnerCourtsPage />} />
            <Route path="/owner/earnings" element={<OwnerEarningsPage />} />
            <Route path="/owner/customers" element={<OwnerCustomersPage />} />
            <Route path="/owner/settings" element={<OwnerSettingsPage />} />
            <Route path="/owner/support" element={<OwnerSupportPage />} />

            <Route path="/owner/courts/new" element={<OwnerCourtFormPage />} />
            <Route
              path="/owner/courts/:id/edit"
              element={<OwnerCourtFormPage />}
            />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}