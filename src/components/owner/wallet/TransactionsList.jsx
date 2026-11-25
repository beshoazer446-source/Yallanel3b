import { Receipt } from "lucide-react";
import { Link } from "react-router-dom";
import { CURRENCY_LABEL, formatMoney } from "../../../lib/moneyUtils";
import {
  formatWalletDateTime,
  getTransactionConfig,
} from "../../../lib/walletLabels";
import EmptyState from "../../dashboard/ui/EmptyState";

const SIGNS = { in: "+", out: "-", internal: "" };

export default function TransactionsList({
  transactions,
  hasMore,
  loadingMore,
  moreError,
  onLoadMore,
}) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="لا توجد معاملات بعد"
        description="أول حجز مؤكد هيظهر هنا، وهيتضاف عربونك للرصيد المعلّق."
      />
    );
  }

  return (
    <>
      <ul className="wallet-list">
        {transactions.map((transaction) => {
          const config = getTransactionConfig(transaction.type);
          const Icon = config.icon;

          return (
            <li key={transaction.id} className="wallet-row">
              <span className={`wallet-row-icon is-${config.direction}`}>
                <Icon size={18} aria-hidden="true" />
              </span>

              <div className="wallet-row-main">
                <strong>{config.label}</strong>
                <span className="wallet-row-meta">
                  <span dir="ltr">
                    {formatWalletDateTime(transaction.created_at)}
                  </span>
                  {transaction.booking_id ? (
                    <>
                      {" · "}
                      <Link to="/owner/bookings" className="wallet-link">
                        حجز #{transaction.booking_id}
                      </Link>
                    </>
                  ) : null}
                </span>
                {config.note ? (
                  <span className="wallet-row-meta">{config.note}</span>
                ) : null}
              </div>

              <span className={`wallet-amount is-${config.direction}`} dir="ltr">
                {SIGNS[config.direction]}
                {formatMoney(transaction.amount)} <small>{CURRENCY_LABEL}</small>
              </span>
            </li>
          );
        })}
      </ul>

      {moreError ? (
        <p className="wallet-notice is-danger" role="alert">
          {moreError}
        </p>
      ) : null}

      {hasMore ? (
        <div className="wallet-more">
          <button
            type="button"
            className="dash-btn dash-btn-secondary"
            onClick={onLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "جاري التحميل..." : "تحميل المزيد"}
          </button>
        </div>
      ) : null}
    </>
  );
}