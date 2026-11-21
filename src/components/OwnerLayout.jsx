import {
  ownerExtraPageTitles,
  ownerNavSections,
} from "../config/ownerNavConfig";
import DashboardLayout from "./dashboard/DashboardLayout";

// Layout الأونر: نفس DashboardLayout العام بس بقايمة الأونر
export default function OwnerLayout() {
  return (
    <DashboardLayout
      sections={ownerNavSections}
      extraTitles={ownerExtraPageTitles}
    />
  );
}
