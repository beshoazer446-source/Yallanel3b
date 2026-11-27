import { useState } from "react";
import {
  getAdminWithdrawals,
  processWithdrawal,
} from "../../services/adminService";
import {
  btnSm,
  runAction,
  tableWrap,
  td,
  th,
  toolbar,
  useAdminData,
} from "./adminShared";

const statusLabels = {
  pending: "قيد المراجعة",
  approved: "تم القبول",
  rejected: "مرفوض",
};
const methodLabels = {
  vodafone_cash: "فودافون كاش",
  instapay: "إنستاباي",
  bank_transfer: "تحويل بنكي",
};

const money = (n) =>
  `${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })} ج.م`;

export default function AdminWithdrawalsPage() {
  const { data, error, reload } = useAdminData(getAdminWithdrawals);
  const [filter, setFilter] = useState("pending");
  const [busyId, setBusyId] = useState(null);

  if (error)
    return (
      <p role="alert" style={{ color: "var(--status-cancelled)" }}>
        {error}
      </p>
    );
  if (!data) return <p>جاري التحميل...</p>;

  const rows =
    filter === "all" ? data : data.filter((r) => r.status === filter);
  const pendingCount = data.filter((r) => r.status === "pending").length;

  async function decide(request, approve) {
    const who = request.owner?.name || "الأونر";
    const message = approve
      ? `قبول سحب ${money(request.amount)} للأونر ${who}؟\n\nالقبول بيسجل الطلب كمقبول بس، لازم تحوّل المبلغ للأونر بنفسك على بياناته. القرار ده مينفعش يتراجع عنه.`
      : `رفض سحب ${money(request.amount)} للأونر ${who}؟\n\nالمبلغ هيرجع لرصيده المتاح.`;
    if (!window.confirm(message)) return;

    setBusyId(request.id);
    await runAction(() => processWithdrawal(request.id, approve), reload);
    setBusyId(null);
  }

  return (
    <div>
      <div style={toolbar}>
        {[
          ["pending", `قيد المراجعة (${pendingCount})`],
          ["approved", "تم القبول"],
          ["rejected", "مرفوض"],
          ["all", "الكل"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`btn ${filter === key ? "btn-primary" : "btn-outline"}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>
          لا توجد طلبات في هذا التصنيف.
        </p>
      ) : (
        <div className="card" style={tableWrap}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>#</th>
                <th style={th}>الأونر</th>
                <th style={th}>المبلغ</th>
                <th style={th}>طريقة الاستلام</th>
                <th style={th}>بيانات الاستلام</th>
                <th style={th}>تاريخ الطلب</th>
                <th style={th}>الحالة</th>
                <th style={th}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={td}>{r.id}</td>
                  <td style={td}>
                    {r.owner?.name || "—"}
                    {r.owner?.phone ? (
                      <div
                        dir="ltr"
                        style={{ color: "var(--text-muted)", fontSize: 13 }}
                      >
                        {r.owner.phone}
                      </div>
                    ) : null}
                  </td>
                  <td style={td}>
                    <strong>{money(r.amount)}</strong>
                  </td>
                  <td style={td}>
                    {methodLabels[r.payout_method] || r.payout_method}
                  </td>
                  <td style={td} dir="ltr">
                    {r.payout_details || "—"}
                  </td>
                  <td style={td}>
                    {r.created_at
                      ? new Date(r.created_at).toLocaleString("ar-EG")
                      : "—"}
                  </td>
                  <td style={td}>
                    {statusLabels[r.status] || r.status}
                    {r.processed_at ? (
                      <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                        {new Date(r.processed_at).toLocaleString("ar-EG")}
                      </div>
                    ) : null}
                  </td>
                  <td style={td}>
                    {r.status === "pending" && (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={btnSm}
                          disabled={busyId === r.id}
                          onClick={() => decide(r, true)}
                        >
                          قبول
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={btnSm}
                          disabled={busyId === r.id}
                          onClick={() => decide(r, false)}
                        >
                          رفض
                        </button>
                      </>
                    )}
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
