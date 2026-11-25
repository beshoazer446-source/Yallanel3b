import { adminNavSections } from "../config/adminNavConfig";
import DashboardLayout from "./dashboard/DashboardLayout";

export default function AdminLayout() {
  return (
    <DashboardLayout sections={adminNavSections} brandName="yallnel3ab Admin" />
  );
}
