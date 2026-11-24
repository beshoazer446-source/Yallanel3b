import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MapPinned,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";

// قايمة الـ sidebar بتاعة الأونر.
// كل عنصر:
//   label           الاسم اللي بيظهر (وبيتستخدم كعنوان للصفحة في الهيدر)
//   icon            أيقونة lucide (الكومبوننت نفسه مش JSX)
//   to              المسار (العناصر اللي ليها action مفيهاش to)
//   end             لو true النشط بيتحدد بالمسار بالظبط بس
//   activePrefixes  مسارات تانية تخلي العنصر ده يفضل نشط (زي المسارات القديمة)
//   action          "logout" يعني العنصر ده بينفذ حاجة بدل ما ينقل لصفحة
// الـ Sidebar بياخد القايمة دي كـ prop، فالسوبر أدمن بعدين يعمل ملف زيها.
export const ownerNavSections = [
  {
    title: "الرئيسية",
    items: [
      {
        label: "نظرة عامة",
        icon: LayoutDashboard,
        to: "/owner/dashboard",
        end: true,
      },
    ],
  },
  {
    title: "الإدارة",
    items: [
      {
        label: "الحجوزات",
        icon: ClipboardList,
        to: "/owner/bookings",
      },
      {
        label: "التقويم",
        icon: CalendarDays,
        to: "/owner/calendar",
      },
      {
        label: "ملاعبي",
        icon: MapPinned,
        to: "/owner/courts",
      },
    ],
  },
  {
    title: "المالية والعملاء",
    items: [
      {
        label: "الأرباح والمدفوعات",
        icon: Wallet,
        to: "/owner/earnings",
      },
      {
        label: "العملاء",
        icon: Users,
        to: "/owner/customers",
      },
    ],
  },
  {
    title: "الحساب",
    items: [
      {
        label: "الحساب الشخصي",
        icon: UserCheck,
        to: "/owner/settings",
      },
      {
        label: "الدعم",
        icon: LifeBuoy,
        to: "/owner/support",
      },
      {
        label: "تسجيل الخروج",
        icon: LogOut,
        action: "logout",
      },
    ],
  },
];

// عناوين الصفحات اللي مش ليها عنصر في الـ sidebar.
// بتتطابق بـ matchPath من react-router.
export const ownerExtraPageTitles = [
  { path: "/owner/courts/new", title: "إضافة ملعب" },
  { path: "/owner/courts/:id/edit", title: "تعديل الملعب" },
];