import { useEffect, useState } from "react";
import { getAdminVenueDetails } from "../../services/adminService";

const days = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];
const methodLabels = {
  vodafone_cash: "فودافون كاش",
  instapay: "إنستاباي",
  etisalat_cash: "اتصالات كاش",
  orange_cash: "أورنج كاش",
  bank_transfer: "تحويل بنكي",
};
const approvalLabels = {
  pending_review: "قيد المراجعة",
  approved: "معتمد",
  rejected: "مرفوض",
};

function Row({ label, children }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "6px 0",
        borderTop: "1px solid var(--border, #e5e7eb)",
      }}
    >
      <span style={{ minWidth: 150, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ flex: 1, wordBreak: "break-word" }}>
        {children || "—"}
      </span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginTop: 20 }}>
      <h3 style={{ marginBottom: 6 }}>{title}</h3>
      {children}
    </section>
  );
}

export default function AdminVenueDetailsModal({ venueId, onClose }) {
  const [details, setDetails] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getAdminVenueDetails(venueId)
      .then((result) => active && setDetails(result))
      .catch((e) => active && setError(e.message || "تعذر تحميل التفاصيل."));
    return () => {
      active = false;
    };
  }, [venueId]);

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const v = details?.venue;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        dir="rtl"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{
          width: "100%",
          maxWidth: 760,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2>{v ? v.name : "تفاصيل الملعب"}</h2>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            إغلاق
          </button>
        </div>

        {error && (
          <p role="alert" style={{ color: "var(--status-cancelled)" }}>
            {error}
          </p>
        )}
        {!details && !error && <p>جاري التحميل...</p>}

        {details && (
          <>
            <Section title="الأونر">
              <Row label="الاسم">{details.owner?.name}</Row>
              <Row label="الإيميل">
                <span dir="ltr">{details.owner?.email}</span>
              </Row>
              <Row label="الهاتف">
                <span dir="ltr">{details.owner?.phone}</span>
              </Row>
              <Row label="حالة الحساب">
                {details.owner
                  ? details.owner.is_active
                    ? "نشط"
                    : "موقوف"
                  : null}
              </Row>
            </Section>

            <Section title="بيانات الملعب">
              <Row label="المدينة">{v.city}</Row>
              <Row label="المنطقة">{v.area}</Row>
              <Row label="العنوان">{v.address}</Row>
              <Row label="رابط الخريطة">
                {v.maps_url ? (
                  <a href={v.maps_url} target="_blank" rel="noreferrer">
                    فتح الخريطة
                  </a>
                ) : null}
              </Row>
              <Row label="الوصف">{v.description}</Row>
              <Row label="سعر الساعة">
                {v.price_per_hour != null ? `${v.price_per_hour} ج.م` : null}
              </Row>
              <Row label="مدة الفترة">
                {v.slot_minutes ? `${v.slot_minutes} دقيقة` : null}
              </Row>
              <Row label="مهلة الإلغاء">
                {v.cancellation_hours != null
                  ? `${v.cancellation_hours} ساعة`
                  : null}
              </Row>
              <Row label="المرافق">
                {v.amenities?.length ? v.amenities.join("، ") : null}
              </Row>
              <Row label="تاريخ الإضافة">
                {v.created_at
                  ? new Date(v.created_at).toLocaleString("ar-EG")
                  : null}
              </Row>
            </Section>

            <Section title="الحالة">
              <Row label="الاعتماد">{approvalLabels[v.approval_status]}</Row>
              <Row label="سبب الرفض">{v.rejection_reason}</Row>
              <Row label="إيقاف الإدارة">
                {v.is_admin_suspended ? "موقوف" : "لا"}
              </Row>
              <Row label="سبب الإيقاف">{v.suspension_reason}</Row>
              <Row label="إخفاء الأونر">
                {v.is_active ? "ظاهر" : "مخفي من الأونر"}
              </Row>
              <Row label="تاريخ المراجعة">
                {v.reviewed_at
                  ? new Date(v.reviewed_at).toLocaleString("ar-EG")
                  : null}
              </Row>
            </Section>

            <Section title="مواعيد العمل">
              {details.hours.length === 0 ? (
                <p style={{ color: "var(--text-muted)" }}>
                  لم يتم تحديد مواعيد.
                </p>
              ) : (
                details.hours.map((h, i) => (
                  <Row key={i} label={days[h.day_of_week]}>
                    {h.open_time?.slice(0, 5)} - {h.close_time?.slice(0, 5)}
                  </Row>
                ))
              )}
            </Section>

            <Section title="طرق الدفع">
              {details.methods.length === 0 ? (
                <p style={{ color: "var(--text-muted)" }}>
                  لم يتم تحديد طرق دفع.
                </p>
              ) : (
                details.methods.map((m, i) => (
                  <Row key={i} label={methodLabels[m.method] || m.method}>
                    <span dir="ltr">{m.account}</span>
                  </Row>
                ))
              )}
            </Section>

            <Section title={`الصور (${details.images.length})`}>
              {details.images.length === 0 ? (
                <p style={{ color: "var(--text-muted)" }}>لا توجد صور.</p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(160px, 1fr))",
                    gap: 10,
                  }}
                >
                  {details.images.map((img) => (
                    <a
                      key={img.id}
                      href={img.image_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={img.image_url}
                        alt=""
                        style={{
                          width: "100%",
                          height: 120,
                          objectFit: "cover",
                          borderRadius: 8,
                        }}
                      />
                    </a>
                  ))}
                </div>
              )}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
