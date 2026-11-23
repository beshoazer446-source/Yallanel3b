// شارة حالة. بنمرر status وهي بتختار الاسم واللون.
// لو احتجت اسم مختلف مرر label.
const STATUS_MAP = {
  active: { label: "نشط", tone: "success" },
  hidden: { label: "مخفي", tone: "muted" },
  confirmed: { label: "مؤكد", tone: "success" },
  pending: { label: "قيد المراجعة", tone: "warning" },
  rejected: { label: "مرفوض", tone: "danger" },
  cancelled: { label: "ملغي", tone: "danger" },
};

export default function StatusBadge({ status, label }) {
  const config = STATUS_MAP[status] ?? { label: status, tone: "muted" };
  return (
    <span className={`dash-badge is-${config.tone}`}>
      {label ?? config.label}
    </span>
  );
}