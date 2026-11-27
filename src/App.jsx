import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./components/MainLayout";
import OwnerLayout from "./components/OwnerLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
import AdminLayout from "./components/AdminLayout";
import SupportRoleGate from "./components/SupportRoleGate";

const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminVenuesPage = lazy(() => import("./pages/admin/AdminVenuesPage"));
const AdminBookingsPage = lazy(() => import("./pages/admin/AdminBookingsPage"));
const AdminSupportListPage = lazy(
  () => import("./pages/admin/AdminSupportListPage"),
);
const AdminSupportTicketPage = lazy(
  () => import("./pages/admin/AdminSupportTicketPage"),
);

const HomePage = lazy(() => import("./pages/HomePage"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const OwnerRegistrationPage = lazy(
  () => import("./pages/auth/OwnerRegistrationPage"),
);
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const VenuesPage = lazy(() => import("./pages/venues/VenuesPage"));
const VenueDetailsPage = lazy(() => import("./pages/venues/VenueDetailsPage"));
const MyBookingsPage = lazy(() => import("./pages/venues/MyBookingsPage"));
const BookingPage = lazy(() => import("./pages/booking/BookingPage"));
const BookingSuccessPage = lazy(
  () => import("./pages/booking/BookingSuccessPage"),
);
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const OwnerOverviewPage = lazy(() => import("./pages/owner/OwnerOverviewPage"));
const OwnerBookingsPage = lazy(() => import("./pages/owner/OwnerBookingsPage"));
const OwnerCalendarPage = lazy(() => import("./pages/owner/OwnerCalendarPage"));
const OwnerCourtsPage = lazy(() => import("./pages/owner/OwnerCourtsPage"));
const OwnerEarningsPage = lazy(() => import("./pages/owner/OwnerEarningsPage"));
const OwnerCustomersPage = lazy(
  () => import("./pages/owner/OwnerCustomersPage"),
);
const OwnerSettingsPage = lazy(() => import("./pages/owner/OwnerSettingsPage"));
const SupportListPage = lazy(() => import("./pages/support/SupportListPage"));
const SupportNewPage = lazy(() => import("./pages/support/SupportNewPage"));
const SupportTicketPage = lazy(
  () => import("./pages/support/SupportTicketPage"),
);
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

          <Route element={<ProtectedRoute />}>
            <Route element={<SupportRoleGate />}>
              <Route
                path="/support"
                element={<SupportListPage basePath="/support" variant="site" />}
              />
              <Route
                path="/support/new"
                element={<SupportNewPage basePath="/support" variant="site" />}
              />
              <Route
                path="/support/:ticketId"
                element={
                  <SupportTicketPage basePath="/support" variant="site" />
                }
              />
            </Route>
          </Route>

        </Route>

        {/* داشبورد الأونر: layout خاص بيه (sidebar) بره MainLayout */}
        <Route element={<ProtectedRoute roles={["owner"]} />}>
          <Route
            path="/owner"
            element={<Navigate to="/owner/dashboard" replace />}
          />

          <Route element={<OwnerLayout />}>
            <Route path="/owner/dashboard" element={<OwnerOverviewPage />} />
            <Route path="/owner/bookings/:id?" element={<OwnerBookingsPage />} />
            <Route path="/owner/calendar" element={<OwnerCalendarPage />} />
            <Route path="/owner/courts" element={<OwnerCourtsPage />} />
            <Route path="/owner/earnings" element={<OwnerEarningsPage />} />
            <Route path="/owner/customers" element={<OwnerCustomersPage />} />
            <Route path="/owner/settings" element={<OwnerSettingsPage />} />
            <Route
              path="/owner/support"
              element={<SupportListPage basePath="/owner/support" />}
            />
            <Route
              path="/owner/support/new"
              element={<SupportNewPage basePath="/owner/support" />}
            />
            <Route
              path="/owner/support/:ticketId"
              element={<SupportTicketPage basePath="/owner/support" />}
            />

            <Route path="/owner/courts/new" element={<OwnerCourtFormPage />} />
            <Route
              path="/owner/courts/:id/edit"
              element={<OwnerCourtFormPage />}
            />
          </Route>
        </Route>
                {/* داشبورد السوبر أدمن: layout خاص بيه (sidebar) بره MainLayout */}
        <Route element={<ProtectedRoute roles={["super_admin"]} />}>
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />

          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/venues" element={<AdminVenuesPage />} />
            <Route path="/admin/bookings" element={<AdminBookingsPage />} />
            <Route path="/admin/support" element={<AdminSupportListPage />} />
            <Route
              path="/admin/support/:ticketId"
              element={<AdminSupportTicketPage />}
            />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
