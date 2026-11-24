import { Banknote, CircleAlert, CircleCheck, Clock, RefreshCw, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ErrorState from "../../components/dashboard/ui/ErrorState";
import PageHeader from "../../components/dashboard/ui/PageHeader";
import Skeleton from "../../components/dashboard/ui/Skeleton";
import BalanceCards from "../../components/owner/wallet/BalanceCards";
import TransactionsList from "../../components/owner/wallet/TransactionsList";
import useOwnerWallet from "../../components/owner/wallet/useOwnerWallet";
import WithdrawalModal from "../../components/owner/wallet/WithdrawalModal";
import WithdrawalRequestsList from "../../components/owner/wallet/WithdrawalRequestsList";
import "../../components/owner/wallet/wallet.css";
import {
  CURRENCY_LABEL,
  MIN_WITHDRAWAL_CENTS,
  formatCents,
  sumCents,
  toCents,
} from "../../lib/moneyUtils";

function WalletSkeleton() {
  return (
    <>
      <div className="wallet-balances">
        <Skeleton height={130} />
        <Skeleton height={130} />
      </div>
      <Skeleton height={44} width="60%" />
      <div style={{ display: "grid", gap: 10 }}>
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} height={56} />
        ))}
      </div>
    </>
  );
}

export default function OwnerEarningsPage() {
  const wallet = useOwnerWallet();
  const [tab, setTab] = useState("transactions");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = setTimeout(() => setSuccessMessage(""), 8000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const availableCents = toCents(wallet.availableBalance) ?? 0;
  const canWithdraw =
    wallet.status === "ready" && availableCents >= MIN_WITHDRAWAL_CENTS;

  const pendingWithdrawals = useMemo(
    () => wallet.withdrawals.filter((request) => request.status === "pending"),
    [wallet.withdrawals],
  );
  const pendingWithdrawalsCents = sumCents(
    pendingWithdrawals.map((request) => request.amount),
  );

  function handleWithdrawSuccess(amountText) {
    setWithdrawOpen(false);
    setTab("withdrawals");
    setSuccessMessage(
      `تم إرسال طلب سحب ${amountText} ${CURRENCY_LABEL}. هيتم مراجعته من الإدارة.`,
    );
    wallet.refresh();
  }

  let body;
  if (wallet.status === "loading") {
    body = <WalletSkeleton />;
  } else if (wallet.status === "error") {
    body = (
      <ErrorState
        title="تعذر تحميل المحفظة"
        message={wallet.error}
        onRetry={wallet.refresh}
        retrying={wallet.refreshing}
      />
    );
  } else {
    body = (
      <>
        {successMessage ? (
          <div className="wallet-notice is-success" role="status">
            <CircleCheck size={18} aria-hidden="true" />
            <span>{successMessage}</span>
            <button
              type="button"
              className="dash-icon-btn"
              onClick={() => setSuccessMessage("")}
              aria-label="إغلاق التنبيه"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ) : null}

        {wallet.error ? (
          <div className="wallet-notice is-danger" role="alert">
            <CircleAlert size={18} aria-hidden="true" />
            <span>{wallet.error}</span>
          </div>
        ) : null}

        {pendingWithdrawals.length > 0 ? (
          <div className="wallet-notice" role="status">
            <Clock size={18} aria-hidden="true" />
            <span>
              عندك {pendingWithdrawals.length} طلب سحب قيد المراجعة بإجمالي{" "}
              <strong dir="ltr">
                {formatCents(pendingWithdrawalsCents)} {CURRENCY_LABEL}
              </strong>
              .
            </span>
          </div>
        ) : null}

        <BalanceCards
          availableBalance={wallet.availableBalance}
          pendingBalance={wallet.pendingBalance}
        />

        <div>
          <div className="wallet-tabs" role="tablist" aria-label="أقسام المحفظة">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "transactions"}
              className={`wallet-tab${tab === "transactions" ? " is-active" : ""}`}
              onClick={() => setTab("transactions")}
            >
              سجل المعاملات
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "withdrawals"}
              className={`wallet-tab${tab === "withdrawals" ? " is-active" : ""}`}
              onClick={() => setTab("withdrawals")}
            >
              طلبات السحب
            </button>
          </div>

          <section className="dash-panel" role="tabpanel">
            {tab === "transactions" ? (
              <TransactionsList
                transactions={wallet.transactions}
                hasMore={wallet.hasMore}
                loadingMore={wallet.loadingMore}
                moreError={wallet.moreError}
                onLoadMore={wallet.loadMore}
              />
            ) : (
              <WithdrawalRequestsList withdrawals={wallet.withdrawals} />
            )}
          </section>
        </div>
      </>
    );
  }

  return (
    <div className="wallet-page">
      <PageHeader
        title="الأرباح والمدفوعات"
        description="رصيدك وسجل معاملاتك وطلبات السحب"
        action={
          <div className="wallet-header-actions">
            <button
              type="button"
              className="dash-btn dash-btn-secondary"
              onClick={wallet.refresh}
              disabled={wallet.refreshing}
            >
              <RefreshCw
                size={16}
                aria-hidden="true"
                className={wallet.refreshing ? "wallet-spin" : undefined}
              />{" "}
              تحديث
            </button>
            <button
              type="button"
              className="dash-btn dash-btn-primary"
              onClick={() => setWithdrawOpen(true)}
              disabled={!canWithdraw}
              title={canWithdraw ? undefined : "الحد الأدنى للسحب 100 ج.م"}
            >
              <Banknote size={16} aria-hidden="true" /> طلب سحب
            </button>
          </div>
        }
      />

      {body}

      {withdrawOpen ? (
        <WithdrawalModal
          availableBalance={wallet.availableBalance}
          onClose={() => setWithdrawOpen(false)}
          onSuccess={handleWithdrawSuccess}
        />
      ) : null}
    </div>
  );
}