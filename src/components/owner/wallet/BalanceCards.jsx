import { Clock, Wallet } from "lucide-react";
import {
  CURRENCY_LABEL,
  MIN_WITHDRAWAL_CENTS,
  formatMoney,
  toCents,
} from "../../../lib/moneyUtils";
import StatCard from "../../dashboard/ui/StatCard";

export default function BalanceCards({ availableBalance, pendingBalance }) {
  const belowMinimum = (toCents(availableBalance) ?? 0) < MIN_WITHDRAWAL_CENTS;

  return (
    <div className="wallet-balances">
      <StatCard
        icon={Wallet}
        label="الرصيد المتاح"
        value={formatMoney(availableBalance)}
        unit={CURRENCY_LABEL}
        hint={
          belowMinimum
            ? "تقدر تسحب لما يوصل رصيدك المتاح إلى 100 ج.م"
            : "المبلغ اللي تقدر تطلب سحبه الآن"
        }
      />
      <StatCard
        icon={Clock}
        label="الرصيد المعلّق"
        value={formatMoney(pendingBalance)}
        unit={CURRENCY_LABEL}
        hint="عربون حجوزات لسه ما انتهتش، وبيتحول للمتاح تلقائيًا بعد انتهاء الحجز"
      />
    </div>
  );
}