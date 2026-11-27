import { CircleAlert } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import "../../dashboard-ui.css";
import { createTicket, sendMessage } from "../../services/supportService";
import FormField from "../dashboard/ui/FormField";
import SectionCard from "../dashboard/ui/SectionCard";
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from "./supportConstants";
import "./support.css";

const SUBJECT_MAX = 120;
const MESSAGE_MAX = 2000;

// نموذج فتح تذكرة. بينشئ التذكرة وبعدين يبعت الرسالة الأولى.
// لو الرسالة فشلت التذكرة بتفضل موجودة (مفيش صلاحية حذف)، فبنعيد محاولة الرسالة بس.
// currentUser = { id, role }، وonCreated(ticket) بتتنادى بعد النجاح.
export default function NewTicketForm({ currentUser, basePath, onCreated }) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("normal");
  const [message, setMessage] = useState("");

  const [createdTicket, setCreatedTicket] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const locked = Boolean(createdTicket) || submitting;

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setError("");

    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();
    if (!cleanSubject) return setError("اكتب موضوع التذكرة.");
    if (!category) return setError("اختار تصنيف المشكلة.");
    if (!cleanMessage) return setError("اكتب تفاصيل المشكلة أو استفسارك.");

    setSubmitting(true);
    let ticket = createdTicket;

    // الخطوة 1: التذكرة (بنتخطاها لو اتعملت في محاولة سابقة)
    if (!ticket) {
      try {
        ticket = await createTicket({
          createdBy: currentUser.id,
          requesterRole: currentUser.role,
          category,
          subject: cleanSubject,
          priority,
        });
        setCreatedTicket(ticket);
      } catch (createError) {
        setError(createError.message || "تعذر إنشاء التذكرة. حاول مرة أخرى.");
        setSubmitting(false);
        return;
      }
    }

    // الخطوة 2: الرسالة الأولى
    try {
      await sendMessage({ ticketId: ticket.id, senderId: currentUser.id, body: cleanMessage });
      onCreated(ticket);
    } catch (messageError) {
      setError(
        `تم إنشاء التذكرة لكن تعذر إرسال رسالتك: ${messageError.message || "خطأ غير معروف"}. اضغط «إعادة إرسال الرسالة» أو افتح التذكرة وابعتها من هناك.`,
      );
      setSubmitting(false);
    }
  }

  return (
    <form className="support-form" onSubmit={handleSubmit}>
      <SectionCard
        title="تفاصيل التذكرة"
        description="اشرح مشكلتك أو استفسارك، وفريق الدعم هيرد عليك هنا وعلى بريدك."
      >
        <FormField label="الموضوع" required>
          <input
            className="dash-input"
            value={subject}
            maxLength={SUBJECT_MAX}
            disabled={locked}
            placeholder="مثال: الحجز اتخصم منه مبلغ ومظهرش في حجوزاتي"
            onChange={(event) => setSubject(event.target.value)}
          />
        </FormField>

        <div className="dash-field-grid">
          <FormField label="التصنيف" required>
            <select
              className="dash-input"
              value={category}
              disabled={locked}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">اختر التصنيف...</option>
              {TICKET_CATEGORIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="الأولوية" hint="اختار «عالية» للمشاكل العاجلة بس.">
            <select
              className="dash-input"
              value={priority}
              disabled={locked}
              onChange={(event) => setPriority(event.target.value)}
            >
              {TICKET_PRIORITIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField
          label="رسالتك"
          required
          hint={`${message.length} / ${MESSAGE_MAX}`}
        >
          <textarea
            className="dash-input"
            rows={6}
            value={message}
            maxLength={MESSAGE_MAX}
            disabled={submitting}
            placeholder="اكتب التفاصيل: إيه اللي حصل، وإمتى، وأي رقم حجز أو ملعب متعلق بالمشكلة."
            onChange={(event) => setMessage(event.target.value)}
          />
        </FormField>

        {error ? (
          <div className="dash-alert is-danger support-flush" role="alert">
            <CircleAlert size={18} aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="support-form-actions">
          <button type="submit" className="dash-btn dash-btn-primary" disabled={submitting}>
            {submitting
              ? "جاري الإرسال..."
              : createdTicket
                ? "إعادة إرسال الرسالة"
                : "إرسال التذكرة"}
          </button>

          {createdTicket ? (
            <Link to={`${basePath}/${createdTicket.id}`} className="dash-btn dash-btn-secondary">
              فتح التذكرة
            </Link>
          ) : (
            <Link to={basePath} className="dash-btn dash-btn-ghost">
              إلغاء
            </Link>
          )}
        </div>
      </SectionCard>
    </form>
  );
}
