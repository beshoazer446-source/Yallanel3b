<<<<<<< HEAD
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./components/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

const HomePage = lazy(() => import("./pages/HomePage"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const OwnerRegistrationPage = lazy(() => import("./pages/auth/OwnerRegistrationPage"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const VenuesPage = lazy(() => import("./pages/venues/VenuesPage"));
const VenueDetailsPage = lazy(() => import("./pages/venues/VenueDetailsPage"));
const MyBookingsPage = lazy(() => import("./pages/venues/MyBookingsPage"));
const BookingPage = lazy(() => import("./pages/booking/BookingPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const OwnerDashboardPage = lazy(() => import("./pages/owner/OwnerDashboardPage"));
const OwnerBookingsPage = lazy(() => import("./pages/owner/OwnerBookingsPage"));
const OwnerVenueFormPage = lazy(() => import("./pages/owner/OwnerVenueFormPage"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
=======

import { Routes, Route, Navigate } from "react-router-dom";

import Placeholder from "./components/Placeholder";
import MainLayout from "./components/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
>>>>>>> origin/main

import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerBookings from "./pages/booking/OwnerBookings";

export default function App() {
  return (
<<<<<<< HEAD
    <Suspense fallback={<p style={{ padding: 24 }}>جاري تحميل الصفحة...</p>}>
      <Routes>
        {/* صفحات الدخول: من غير Navbar */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register-owner" element={<OwnerRegistrationPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* باقي الصفحات: فيها Navbar */}
        <Route element={<MainLayout />}>
          {/* ===== صفحات مفتوحة لأي حد ===== */}
          <Route path="/" element={<HomePage />} />
          <Route path="/venues" element={<VenuesPage />} />
          <Route path="/venues/:id" element={<VenueDetailsPage />} />

          {/* ===== أي حد مسجّل دخول ===== */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* ===== اللاعب بس ===== */}
          <Route element={<ProtectedRoute roles={["user"]} />}>
            <Route path="/book/:venueId" element={<BookingPage />} />
            <Route path="/my-bookings" element={<MyBookingsPage />} />
          </Route>

          {/* ===== صاحب الملعب بس ===== */}
          <Route element={<ProtectedRoute roles={["owner"]} />}>
            <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
            <Route path="/owner/bookings" element={<OwnerBookingsPage />} />
            <Route path="/owner/venues/new" element={<OwnerVenueFormPage />} />
            <Route path="/owner/venues/:id/edit" element={<OwnerVenueFormPage />} />
          </Route>

          {/* ===== الأدمن بس ===== */}
          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
=======
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
>>>>>>> origin/main
  );
}
