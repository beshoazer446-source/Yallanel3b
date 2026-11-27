import {
  adminExtraPageTitles,
  adminNavSections,
} from "../config/adminNavConfig";
import DashboardLayout from "./dashboard/DashboardLayout";

export default function AdminLayout() {
  return (
    <DashboardLayout
      sections={adminNavSections}
      extraTitles={adminExtraPageTitles}
      brandName="Yallnel3ab Admin"
    />
  );
}
