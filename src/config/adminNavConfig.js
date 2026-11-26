import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Users,
  Wallet,
} from "lucide-react";

export const adminNavSections = [
  {
    title: "الرئيسية",
    items: [
      {
        label: "نظرة عامة",
        icon: LayoutDashboard,
        to: "/admin/dashboard",
        end: true,
      },
    ],
  },
  {
    title: "الإدارة",
    items: [
      { label: "المستخدمون", icon: Users, to: "/admin/users" },
      { label: "الملاعب", icon: MapPinned, to: "/admin/venues" },
      { label: "الحجوزات", icon: ClipboardList, to: "/admin/bookings" },
      { label: "المعاملات", icon: Wallet, to: "/admin/transactions" },
    ],
  },
  {
    title: "الحساب",
    items: [{ label: "تسجيل الخروج", icon: LogOut, action: "logout" }],
  },
];