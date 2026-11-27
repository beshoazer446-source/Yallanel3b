import { Banknote } from "lucide-react";
import { CURRENCY_LABEL, formatMoney } from "../../../lib/moneyUtils";
import {
  formatWalletDateTime,
  getPayoutMethod,
  maskPayoutDetails,
} from "../../../lib/walletLabels";
import EmptyState from "../../dashboard/ui/EmptyState";
import StatusBadge from "../../dashboard/ui/StatusBadge";

export default function WithdrawalRequestsList({ withdrawals }) {
  if (withdrawals.length === 0) {
    return (
      <EmptyState
        icon={Banknote}
        title="لا توجد طلبات سحب"
        description="لما تطلب سحب أرباحك هتلاقي الطلب وحالته هنا."
      />
    );
  }

  return (
    <ul className="wallet-list">
      {withdrawals.map((request) => {
        const method = getPayoutMethod(request.payout_method);

        return (
          <li key={request.id} className="wallet-row">
            <span className="wallet-row-icon is-internal">
              <Banknote size={18} aria-hidden="true" />
            </span>

            <div className="wallet-row-main">
              <strong dir="ltr" className="wallet-amount-text">
                {formatMoney(request.amount)} {CURRENCY_LABEL}
              </strong>
              <span className="wallet-row-meta">
                {method?.label ?? request.payout_method ?? "—"}
                {request.payout_details ? (
                  <>
                    {" · "}
                    <span dir="ltr">
                      {maskPayoutDetails(request.payout_details)}
                    </span>
                  </>
                ) : null}
              </span>
              <span className="wallet-row-meta">
                طُلب في{" "}
                <span dir="ltr">
                  {formatWalletDateTime(request.requested_at)}
                </span>
                {request.processed_at ? (
                  <>
                    {" · "}تمت المعالجة في{" "}
                    <span dir="ltr">
                      {formatWalletDateTime(request.processed_at)}
                    </span>
                  </>
                ) : null}
              </span>
            </div>

            <StatusBadge status={request.status} />
          </li>
        );
      })}
    </ul>
  );
}