import { supabase } from "../lib/supabaseClient";

export const TRANSACTIONS_PAGE_SIZE = 20;

// بتحوّل الفلوس المعلّقة المستحقة للمتاح. لازم تتنادى قبل قراءة الأرصدة.
async function releaseDueFunds() {
  const { error } = await supabase.rpc("release_my_due_funds");
  if (error) throw error;
}

// ممكن ترجع null لو الأونر لسه معندوش محفظة
async function fetchWallet(ownerId) {
  const { data, error } = await supabase
    .from("wallets")
    .select("id, available_balance, pending_balance")
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// بنطلب صف زيادة عشان نعرف لو فيه صفحة تانية
export async function fetchTransactions(walletId, offset = 0) {
  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("id, type, amount, created_at, booking_id")
    .eq("wallet_id", walletId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + TRANSACTIONS_PAGE_SIZE);
  if (error) throw error;

  const rows = data ?? [];
  return {
    items: rows.slice(0, TRANSACTIONS_PAGE_SIZE),
    hasMore: rows.length > TRANSACTIONS_PAGE_SIZE,
  };
}

async function fetchWithdrawals(walletId) {
  const { data, error } = await supabase
    .from("withdrawal_requests")
    .select(
      "id, amount, status, requested_at, processed_at, payout_method, payout_details",
    )
    .eq("wallet_id", walletId)
    .order("requested_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

// كل بيانات الصفحة مرة واحدة
export async function loadWalletOverview(ownerId) {
  try {
    await releaseDueFunds();
  } catch (error) {
    // فشل التحويل مش لازم يمنع عرض الأرصدة (ومحفظة غير موجودة معناها صفر)
    console.warn("release_my_due_funds failed:", error);
  }

  const wallet = await fetchWallet(ownerId);
  if (!wallet) {
    return {
      wallet: null,
      transactions: { items: [], hasMore: false },
      withdrawals: [],
    };
  }

  const [transactions, withdrawals] = await Promise.all([
    fetchTransactions(wallet.id),
    fetchWithdrawals(wallet.id),
  ]);
  return { wallet, transactions, withdrawals };
}

// amount لازم يكون نص عشري زي "150.50"
export async function requestWithdrawal({ amount, method, details }) {
  const { data, error } = await supabase.rpc("request_withdrawal", {
    p_amount: amount,
    p_method: method,
    p_details: details,
  });
  if (error) throw error;
  return data;
}