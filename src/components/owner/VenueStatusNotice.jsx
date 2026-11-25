// بيعرض حالة المراجعة للأونر. لو الملعب معتمد وشغال مبيعرضش حاجة.
export default function VenueStatusNotice({ venue }) {
  let tone = null;
  let title = "";
  let text = "";

  if (venue.approval_status === "pending_review") {
    tone = "#b45309";
    title = "قيد المراجعة";
    text = "الملعب لسه مش ظاهر للاعبين. هيظهر بعد موافقة الإدارة.";
  } else if (venue.approval_status === "rejected") {
    tone = "#b91c1c";
    title = "تم رفض الملعب";
    text = venue.rejection_reason || "لم يتم ذكر سبب.";
  } else if (venue.is_admin_suspended) {
    tone = "#b91c1c";
    title = "الملعب موقوف من الإدارة";
    text = venue.suspension_reason || "لم يتم ذكر سبب.";
  }

  if (!tone) return null;

  return (
    <div
      role="status"
      style={{
        border: `1px solid ${tone}`,
        color: tone,
        borderRadius: 8,
        padding: "8px 12px",
        marginTop: 8,
        fontSize: 14,
      }}
    >
      <strong>{title}</strong>
      <p style={{ margin: "4px 0 0" }}>{text}</p>
    </div>
  );
}
