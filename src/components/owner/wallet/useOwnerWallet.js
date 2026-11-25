import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../context/useAuth";
import { getWalletErrorMessage } from "../../../lib/walletErrors";
import {
  fetchTransactions,
  loadWalletOverview,
} from "../../../services/walletService";

function mergeById(current, incoming) {
  const seen = new Set(current.map((item) => item.id));
  return [...current, ...incoming.filter((item) => !seen.has(item.id))];
}

// كل بيانات صفحة محفظة الأونر + التحديث وتحميل المزيد
export default function useOwnerWallet() {
  const { user } = useAuth();
  const ownerId = user?.id ?? null;

  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState("");
  const [withdrawals, setWithdrawals] = useState([]);

  useEffect(() => {
    if (!ownerId) return undefined;
    let cancelled = false;

    loadWalletOverview(ownerId)
      .then((data) => {
        if (cancelled) return;
        setWallet(data.wallet);
        setTransactions(data.transactions.items);
        setHasMore(data.transactions.hasMore);
        setWithdrawals(data.withdrawals);
        setMoreError("");
        setError("");
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(getWalletErrorMessage(err, "تعذر تحميل بيانات المحفظة."));
        // لو فيه بيانات معروضة أصلًا بنسيبها ونعرض الخطأ كتنبيه
        setStatus((current) => (current === "loading" ? "error" : current));
      })
      .finally(() => {
        if (!cancelled) setRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ownerId, reloadKey]);

  const refresh = useCallback(() => {
    setError("");
    setStatus((current) => (current === "error" ? "loading" : current));
    setRefreshing(true);
    setReloadKey((key) => key + 1);
  }, []);

  const walletId = wallet?.id ?? null;
  const loadedCount = transactions.length;

  const loadMore = useCallback(async () => {
    if (!walletId || loadingMore) return;
    setLoadingMore(true);
    setMoreError("");
    try {
      const page = await fetchTransactions(walletId, loadedCount);
      setTransactions((current) => mergeById(current, page.items));
      setHasMore(page.hasMore);
    } catch (err) {
      setMoreError(getWalletErrorMessage(err, "تعذر تحميل المزيد."));
    } finally {
      setLoadingMore(false);
    }
  }, [walletId, loadingMore, loadedCount]);

  return {
    status,
    error,
    refreshing,
    refresh,
    // محفظة مش موجودة = أرصدة صفر
    availableBalance: wallet?.available_balance ?? 0,
    pendingBalance: wallet?.pending_balance ?? 0,
    transactions,
    hasMore,
    loadingMore,
    moreError,
    loadMore,
    withdrawals,
  };
}