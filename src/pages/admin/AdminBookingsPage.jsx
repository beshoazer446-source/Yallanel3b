import { useState } from "react";
import {
  cancelBookingAsAdmin,
  getAdminBookings,
} from "../../services/adminService";
import {
  askReason,
  btnSm,
  runAction,
  tableWrap,
  td,
  th,
  toolbar,
  useAdminData,
} from "./adminShared";

const statusLabels = {
  pending: "لم يكتمل الدفع",
  confirmed: "مؤكد",
  rejected: "مرفوض",
  cancelled: "ملغي",
};

export default function AdminBookingsPage() {
  const { data, error, reload } = useAdminData(getAdminBookings);
  const [status, setStatus] = useState("all");

  if (error)
    return (
      <p role="alert" style={{ color: "var(--status-cancelled)" }}>
        {error}
      </p>
    );
  if (!data) return <p>جاري التحميل...</p>;

  const rows =
    status === "all" ? data : data.filter((b) => b.status === status);

  // الأحوط: الإلغاء متاح فقط لو مفيش فلوس اتحركت (payout_status فاضي).
  // لفتحه لكل الحجوزات بعد موافقة زميلك: خلّي canCancel = ["pending", "confirmed"].includes(b.status)
  function canCancel(b) {
    return ["pending", "confirmed"].includes(b.status) && !b.payout_status;
  }

  function cancel(b) {
    const reason = askReason("سبب الإلغاء (إجباري):");
    if (!reason) return;
    runAction(async () => {
      await cancelBookingAsAdmin(b.id, reason);
      window.alert("تم إلغاء الحجز وتسجيل السبب.");
    }, reload);
  }

  return (
    <div>
      <div style={toolbar}>
        {[
          ["all", "الكل"],
          ["pending", "قيد الانتظار"],
          ["confirmed", "مؤكد"],
          ["cancelled", "ملغي"],
          ["rejected", "مرفوض"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`btn ${status === key ? "btn-primary" : "btn-outline"}`}
            onClick={() => setStatus(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>لا توجد حجوزات.</p>
      ) : (
        <div className="card" style={tableWrap}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>#</th>
                <th style={th}>الملعب</th>
                <th style={th}>اللاعب</th>
                <th style={th}>الموعد</th>
                <th style={th}>الحالة</th>
                <th style={th}>الدفع</th>
                <th style={th}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td style={td}>{b.id}</td>
                  <td style={td}>{b.venue?.name || "—"}</td>
                  <td style={td}>{b.player?.name || "—"}</td>
                  <td style={td}>
                    {b.date} | {b.start_time?.slice(0, 5)} -{" "}
                    {b.end_time?.slice(0, 5)}
                  </td>
                  <td style={td} title={b.cancellation_reason || ""}>
                    {statusLabels[b.status]}
                    {b.status === "cancelled" && b.cancellation_reason
                      ? ` (${b.cancellation_reason})`
                      : ""}
                  </td>
                  <td style={td}>
                    {b.payment_method === "online" ? "أونلاين" : "في الملعب"}
                    {b.payout_status ? " (مدفوع)" : ""}
                  </td>
                  <td style={td}>
                    {canCancel(b) ? (
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={btnSm}
                        onClick={() => cancel(b)}
                      >
                        إلغاء
                      </button>
                    ) : ["pending", "confirmed"].includes(b.status) ? (
                      <span
                        style={{ color: "var(--text-muted)", fontSize: 13 }}
                      >
                        مدفوع: يحتاج مراجعة الدفع
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
