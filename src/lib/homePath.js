// الصفحة اللي المستخدم يروحلها بعد الدخول، حسب نوع حسابه
export function homePath(role) {
  if (role === "owner") return "/owner/dashboard";
  if (role === "admin") return "/admin/dashboard";
  return "/venues";
}
