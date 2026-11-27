import {
  ClipboardList,
  LayoutDashboard,
  LifeBuoy,
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
      { label: "طلبات السحب", icon: Wallet, to: "/admin/withdrawals" },
      { label: "الحجوزات", icon: ClipboardList, to: "/admin/bookings" },
      { label: "الدعم", icon: LifeBuoy, to: "/admin/support" },
      { label: "المعاملات", icon: Wallet, to: "/admin/transactions" },
    ],
  },
  {
    title: "الحساب",
    items: [{ label: "تسجيل الخروج", icon: LogOut, action: "logout" }],
  },
];

// عناوين الصفحات اللي مالهاش عنصر في الـ sidebar (بتظهر في الهيدر)
export const adminExtraPageTitles = [
  { path: "/admin/support/:ticketId", title: "تفاصيل التذكرة" },
];