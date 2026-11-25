import { useState } from "react";
import AdminVenueDetailsModal from "./AdminVenueDetailsModal";
import {
  approveVenue,
  getAdminVenues,
  rejectVenue,
  suspendVenue,
  unsuspendVenue,
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

const approvalLabels = {
  pending_review: "قيد المراجعة",
  approved: "معتمد",
  rejected: "مرفوض",
};

export default function AdminVenuesPage() {
  const { data, error, reload } = useAdminData(getAdminVenues);
  const [filter, setFilter] = useState("pending_review");
  const [detailsId, setDetailsId] = useState(null);

  if (error)
    return (
      <p role="alert" style={{ color: "var(--status-cancelled)" }}>
        {error}
      </p>
    );
  if (!data) return <p>جاري التحميل...</p>;

  const rows =
    filter === "all" ? data : data.filter((v) => v.approval_status === filter);

  function reject(v) {
    const reason = askReason("سبب الرفض (إجباري):");
    if (reason) runAction(() => rejectVenue(v.id, reason), reload);
  }
  function suspend(v) {
    const reason = askReason("سبب الإيقاف (إجباري):");
    if (reason) runAction(() => suspendVenue(v.id, reason), reload);
  }

  return (
    <div>
      <div style={toolbar}>
        {[
          ["pending_review", "قيد المراجعة"],
          ["approved", "معتمد"],
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
          لا توجد ملاعب في هذا التصنيف.
        </p>
      ) : (
        <div className="card" style={tableWrap}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>الملعب</th>
                <th style={th}>المدينة</th>
                <th style={th}>الأونر</th>
                <th style={th}>الاعتماد</th>
                <th style={th}>التشغيل</th>
                <th style={th}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id}>
                  <td style={td}>{v.name}</td>
                  <td style={td}>
                    {v.city}
                    {v.area ? ` - ${v.area}` : ""}
                  </td>
                  <td style={td}>{v.owner?.name || "—"}</td>
                  <td style={td} title={v.rejection_reason || ""}>
                    {approvalLabels[v.approval_status]}
                    {v.approval_status === "rejected" && v.rejection_reason
                      ? ` (${v.rejection_reason})`
                      : ""}
                  </td>
                  <td style={td} title={v.suspension_reason || ""}>
                    {v.is_admin_suspended
                      ? "موقوف من الإدارة"
                      : v.is_active
                        ? "يعمل"
                        : "مخفي من الأونر"}
                  </td>
                  <td style={td}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={btnSm}
                      onClick={() => setDetailsId(v.id)}
                    >
                      تفاصيل
                    </button>
                    {v.approval_status !== "approved" && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={btnSm}
                        onClick={() =>
                          runAction(() => approveVenue(v.id), reload)
                        }
                      >
                        اعتماد
                      </button>
                    )}
                    {v.approval_status !== "rejected" && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={btnSm}
                        onClick={() => reject(v)}
                      >
                        رفض
                      </button>
                    )}
                    {v.approval_status === "approved" &&
                      (v.is_admin_suspended ? (
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={btnSm}
                          onClick={() =>
                            runAction(() => unsuspendVenue(v.id), reload)
                          }
                        >
                          إعادة تشغيل
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={btnSm}
                          onClick={() => suspend(v)}
                        >
                          إيقاف
                        </button>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {detailsId && (
        <AdminVenueDetailsModal
          venueId={detailsId}
          onClose={() => setDetailsId(null)}
        />
      )}
    </div>
  );
}
