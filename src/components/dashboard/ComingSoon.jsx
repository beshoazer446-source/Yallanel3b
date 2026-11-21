import { Hammer } from "lucide-react";

// محتوى مؤقت للصفحات اللي لسه ما اتبنتش
export default function ComingSoon() {
  return (
    <div
      className="card"
      style={{
        display: "grid",
        justifyItems: "center",
        gap: 12,
        padding: "56px 24px",
        textAlign: "center",
      }}
    >
      <Hammer size={32} color="var(--text-muted)" aria-hidden="true" />
      <h2 style={{ color: "var(--text-strong)", fontSize: 20 }}>
        هذه الصفحة قيد التجهيز
      </h2>
      <p style={{ color: "var(--text-muted)" }}>سنضيفها قريبًا.</p>
    </div>
  );
}
