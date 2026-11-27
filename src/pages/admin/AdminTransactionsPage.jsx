import { useMemo, useState } from "react";
import PageHeader from "../../components/dashboard/ui/PageHeader";
import { PLATFORM_COMMISSION_PERCENT } from "../../lib/constants";
import { getAdminTransactions } from "../../services/adminService";
import { tableWrap, td, th, useAdminData } from "./adminShared";
import "./AdminTransactions.css";

const STATUS_META = {
  confirmed: { label: "مؤكد", cls: "tx-badge-confirmed" },
  pending: { label: "قيد المراجعة", cls: "tx-badge-pending" },
  cancelled: { label: "ملغي", cls: "tx-badge-cancelled" },
  rejected: { label: "مرفوض", cls: "tx-badge-cancelled" },
};

const WITHDRAWAL_STATUS = {
  pending: { label: "قيد المراجعة", cls: "tx-badge-pending" },
  approved: { label: "تم التحويل", cls: "tx-badge-confirmed" },
  paid: { label: "تم التحويل", cls: "tx-badge-confirmed" },
  rejected: { label: "مرفوض", cls: "tx-badge-cancelled" },
};

function formatEGP(num) {
  return `${Number(num || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ج.م`;
}

export default function AdminTransactionsPage() {
  const { data, error } = useAdminData(getAdminTransactions);
  const [activeTab, setActiveTab] = useState("venues"); // venues | bookings | withdrawals
  const [selectedVenue, setSelectedVenue] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // كروت الإحصائيات بتتحدث حسب الملعب المختار (أو كل الملاعب لو مختار "جميع الملاعب")
  const stats = useMemo(() => {
    if (!data) return null;

    const scopedTransactions =
      selectedVenue === "all"
        ? data.transactions
        : data.transactions.filter((t) => String(t.venue_id) === selectedVenue);

    const confirmed = scopedTransactions.filter((t) => t.status === "confirmed");
    const pending = scopedTransactions.filter((t) => t.status === "pending");

    const gross = confirmed.reduce((s, t) => s + t.totalPrice, 0);
    const commission = confirmed.reduce((s, t) => s + t.commission, 0);
    const ownerNet = confirmed.reduce((s, t) => s + t.ownerNet, 0);
    const deposits = confirmed.reduce((s, t) => s + t.depositAmount, 0);
    const pendingTotal = pending.reduce((s, t) => s + t.totalPrice, 0);

    let totalAvailableWallets = 0;
    if (selectedVenue === "all") {
      totalAvailableWallets = data.wallets.reduce(
        (s, w) => s + Number(w.available_balance || 0),
        0,
      );
    } else {
      const venueObj = data.venues.find((v) => String(v.id) === selectedVenue);
      const ownerWallet = venueObj
        ? data.wallets.find((w) => String(w.owner_id) === String(venueObj.owner_id))
        : null;
      totalAvailableWallets = Number(ownerWallet?.available_balance || 0);
    }

    const selectedVenueName =
      selectedVenue === "all"
        ? null
        : data.venues.find((v) => String(v.id) === selectedVenue)?.name || null;

    return {
      gross,
      commission,
      ownerNet,
      deposits,
      pendingTotal,
      totalAvailableWallets,
      confirmedCount: confirmed.length,
      selectedVenueName,
    };
  }, [data, selectedVenue]);

  const filteredVenueSummaries = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.venueSummaries.filter((row) => {
      if (selectedVenue !== "all" && String(row.venue.id) !== selectedVenue) {
        return false;
      }
      if (!q) return true;
      return (
        row.venue.name?.toLowerCase().includes(q) ||
        row.venue.city?.toLowerCase().includes(q) ||
        row.owner?.name?.toLowerCase().includes(q)
      );
    });
  }, [data, selectedVenue, search]);

  const filteredTransactions = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.transactions.filter((tx) => {
      if (selectedVenue !== "all" && String(tx.venue_id) !== selectedVenue) {
        return false;
      }
      if (statusFilter !== "all" && tx.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        String(tx.id).includes(q) ||
        tx.venue?.name?.toLowerCase().includes(q) ||
        tx.owner?.name?.toLowerCase().includes(q) ||
        tx.player?.name?.toLowerCase().includes(q)
      );
    });
  }, [data, selectedVenue, statusFilter, search]);

  if (error) {
    return (
      <p role="alert" style={{ color: "var(--status-cancelled)" }}>
        {error}
      </p>
    );
  }
  if (!data || !stats) return <p>جاري تحميل المعاملات المالية...</p>;

  return (
    <div className="admin-tx-page">
      <PageHeader
        title="المعاملات المالية"
        subtitle={
          stats.selectedVenueName
            ? `عرض الإحصائيات والمعاملات الخاصة بملعب: ${stats.selectedVenueName}`
            : "متابعة شاملة لإيرادات كل ملعب، العمولات، العربون، ومستحقات أصحاب الملاعب"
        }
      />

      {/* كروت الإحصائيات المالية */}
      <div className="admin-tx-stats">
        <div className="admin-tx-stat-card">
          <span className="admin-tx-stat-label">
            {stats.selectedVenueName
              ? `إجمالي حجوزات (${stats.selectedVenueName})`
              : "إجمالي حجم الحجوزات المؤكدة"}
          </span>
          <strong className="admin-tx-stat-value">{formatEGP(stats.gross)}</strong>
          <span className="admin-tx-stat-sub">عدد {stats.confirmedCount} حجز مؤكد</span>
        </div>

        <div className="admin-tx-stat-card">
          <span className="admin-tx-stat-label">
            أرباح المنصة ({PLATFORM_COMMISSION_PERCENT}%)
          </span>
          <strong className="admin-tx-stat-value is-green">
            {formatEGP(stats.commission)}
          </strong>
          <span className="admin-tx-stat-sub">
            {stats.selectedVenueName ? `من ملعب ${stats.selectedVenueName}` : "صافي عمولات المنصة"}
          </span>
        </div>

        <div className="admin-tx-stat-card">
          <span className="admin-tx-stat-label">صافي مستحقات صاحب الملعب</span>
          <strong className="admin-tx-stat-value">{formatEGP(stats.ownerNet)}</strong>
          <span className="admin-tx-stat-sub">
            المتاح بالمحفظة: {formatEGP(stats.totalAvailableWallets)}
          </span>
        </div>

        <div className="admin-tx-stat-card">
          <span className="admin-tx-stat-label">إجمالي العربون المحصّل</span>
          <strong className="admin-tx-stat-value is-yellow">
            {formatEGP(stats.deposits)}
          </strong>
          <span className="admin-tx-stat-sub">
            حجوزات معلقة: {formatEGP(stats.pendingTotal)}
          </span>
        </div>
      </div>

      {/* شريط التبديل والفلاتر */}
      <div className="admin-tx-controls">
        <div className="admin-tx-tabs">
          <button
            type="button"
            className={`admin-tx-tab ${activeTab === "venues" ? "is-active" : ""}`}
            onClick={() => setActiveTab("venues")}
          >
            ملخص كل ملعب ({data.venueSummaries.length})
          </button>
          <button
            type="button"
            className={`admin-tx-tab ${activeTab === "bookings" ? "is-active" : ""}`}
            onClick={() => setActiveTab("bookings")}
          >
            سجل المعاملات التفصيلي ({filteredTransactions.length})
          </button>
          <button
            type="button"
            className={`admin-tx-tab ${activeTab === "withdrawals" ? "is-active" : ""}`}
            onClick={() => setActiveTab("withdrawals")}
          >
            طلبات السحب ({data.withdrawals.length})
          </button>
        </div>

        <div className="admin-tx-filters">
          {activeTab !== "withdrawals" && (
            <>
              <input
                type="search"
                className="admin-tx-input"
                placeholder="بحث باسم الملعب، المالك، اللاعب..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                className="admin-tx-select"
                value={selectedVenue}
                onChange={(e) => setSelectedVenue(e.target.value)}
                aria-label="تصفية حسب الملعب"
              >
                <option value="all">جميع الملاعب</option>
                {data.venues.map((v) => (
                  <option key={v.id} value={String(v.id)}>
                    {v.name}
                  </option>
                ))}
              </select>
            </>
          )}

          {activeTab === "bookings" && (
            <select
              className="admin-tx-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="تصفية حسب الحالة"
            >
              <option value="all">كل الحالات</option>
              <option value="confirmed">مؤكد</option>
              <option value="pending">قيد المراجعة</option>
              <option value="cancelled">ملغي</option>
              <option value="rejected">مرفوض</option>
            </select>
          )}
        </div>
      </div>

      {/* التبويب 1: ملخص مالي لكل ملعب */}
      {activeTab === "venues" && (
        <div className="card" style={tableWrap}>
          {filteredVenueSummaries.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>لا توجد ملاعب مطابقة.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>الملعب</th>
                  <th style={th}>صاحب الملعب</th>
                  <th style={th}>الحجوزات المؤكدة</th>
                  <th style={th}>إجمالي الإيرادات</th>
                  <th style={th}>العربون المحصّل</th>
                  <th style={th}>عمولة المنصة ({PLATFORM_COMMISSION_PERCENT}%)</th>
                  <th style={th}>صافي صاحب الملعب</th>
                  <th style={th}>رصيد المحفظة (متاح / معلق)</th>
                </tr>
              </thead>
              <tbody>
                {filteredVenueSummaries.map((row) => (
                  <tr key={row.venue.id}>
                    <td style={td}>
                      <strong style={{ color: "var(--text-strong)" }}>
                        {row.venue.name}
                      </strong>
                      {row.venue.city && (
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {row.venue.city}
                        </div>
                      )}
                    </td>
                    <td style={td}>{row.owner?.name || "—"}</td>
                    <td style={td}>
                      {row.confirmedCount}{" "}
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        (من {row.totalBookings})
                      </span>
                    </td>
                    <td style={td} className="tx-amount-strong">
                      {formatEGP(row.grossRevenue)}
                    </td>
                    <td style={td} className="tx-amount-muted">
                      {formatEGP(row.totalDeposits)}
                    </td>
                    <td style={td} className="tx-amount-green">
                      {formatEGP(row.platformCommission)}
                    </td>
                    <td style={td} className="tx-amount-strong">
                      {formatEGP(row.ownerNetEarnings)}
                    </td>
                    <td style={td}>
                      {row.wallet ? (
                        <span style={{ fontSize: 13 }}>
                          <strong style={{ color: "var(--status-confirmed)" }}>
                            {formatEGP(row.wallet.available_balance)}
                          </strong>
                          {" / "}
                          <span style={{ color: "var(--text-muted)" }}>
                            {formatEGP(row.wallet.pending_balance)}
                          </span>
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                          لا توجد محفظة
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* التبويب 2: سجل المعاملات التفصيلي */}
      {activeTab === "bookings" && (
        <div className="card" style={tableWrap}>
          {filteredTransactions.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>لا توجد معاملات مطابقة.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>#</th>
                  <th style={th}>الملعب</th>
                  <th style={th}>صاحب الملعب</th>
                  <th style={th}>اللاعب</th>
                  <th style={th}>التاريخ والموعد</th>
                  <th style={th}>إجمالي الحجز</th>
                  <th style={th}>العربون</th>
                  <th style={th}>عمولة المنصة</th>
                  <th style={th}>صافي الملعب</th>
                  <th style={th}>الدفع</th>
                  <th style={th}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const st = STATUS_META[tx.status] || {
                    label: tx.status,
                    cls: "tx-badge-pending",
                  };
                  return (
                    <tr key={tx.id}>
                      <td style={td}>{tx.id}</td>
                      <td style={td}>
                        <strong>{tx.venue?.name || "—"}</strong>
                      </td>
                      <td style={td}>{tx.owner?.name || "—"}</td>
                      <td style={td}>{tx.player?.name || "—"}</td>
                      <td style={td} style={{ whiteSpace: "nowrap" }}>
                        {tx.date} | {tx.start_time?.slice(0, 5)}
                      </td>
                      <td style={td} className="tx-amount-strong">
                        {formatEGP(tx.totalPrice)}
                      </td>
                      <td style={td} className="tx-amount-muted">
                        {formatEGP(tx.depositAmount)}
                      </td>
                      <td style={td} className="tx-amount-green">
                        {formatEGP(tx.commission)}
                      </td>
                      <td style={td} className="tx-amount-strong">
                        {formatEGP(tx.ownerNet)}
                      </td>
                      <td style={td}>
                        {tx.payment_method === "online" ? "أونلاين" : "في الملعب"}
                        {tx.payout_status ? ` (${tx.payout_status})` : ""}
                      </td>
                      <td style={td}>
                        <span className={`tx-badge ${st.cls}`}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* التبويب 3: طلبات السحب من المحافظ */}
      {activeTab === "withdrawals" && (
        <div className="card" style={tableWrap}>
          {data.withdrawals.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>لا توجد طلبات سحب مسجلة.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>#</th>
                  <th style={th}>رقم المحفظة</th>
                  <th style={th}>المبلغ المطلوب</th>
                  <th style={th}>طريقة السحب</th>
                  <th style={th}>بيانات الحساب</th>
                  <th style={th}>تاريخ الطلب</th>
                  <th style={th}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {data.withdrawals.map((w) => {
                  const st = WITHDRAWAL_STATUS[w.status] || {
                    label: w.status,
                    cls: "tx-badge-pending",
                  };
                  return (
                    <tr key={w.id}>
                      <td style={td}>{w.id}</td>
                      <td style={td}>{w.wallet_id}</td>
                      <td style={td} className="tx-amount-strong">
                        {formatEGP(w.amount)}
                      </td>
                      <td style={td}>{w.payout_method || "—"}</td>
                      <td style={td}>{w.payout_details || "—"}</td>
                      <td style={td}>
                        {w.requested_at
                          ? new Date(w.requested_at).toLocaleDateString("ar-EG")
                          : "—"}
                      </td>
                      <td style={td}>
                        <span className={`tx-badge ${st.cls}`}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}