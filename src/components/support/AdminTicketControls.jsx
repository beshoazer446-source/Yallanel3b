import { CircleAlert } from "lucide-react";
import { useState } from "react";
import "../../dashboard-ui.css";
import { updateTicket } from "../../services/supportService";
import ConfirmDialog from "../dashboard/ui/ConfirmDialog";
import FormField from "../dashboard/ui/FormField";
import Panel from "../dashboard/ui/Panel";
import { TICKET_PRIORITIES, TICKET_STATUSES } from "./supportConstants";
import "./support.css";

// تغيير حالة وأولوية التذكرة (للأدمن). الاختيار بيتحفظ فورًا،
// ولو فشل القايمة بترجع للقيمة القديمة لأنها متحكم فيها من التذكرة نفسها.
export default function AdminTicketControls({ ticket, onUpdated }) {
  const [busyField, setBusyField] = useState("");
  const [error, setError] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);

  async function save(field, value) {
    setBusyField(field);
    setError("");
    try {
      const updated = await updateTicket(ticket.id, { [field]: value });
      onUpdated(updated);
    } catch (saveError) {
      setError(saveError.message || "تعذر تحديث التذكرة.");
    } finally {
      setBusyField("");
      setConfirmClose(false);
    }
  }

  function handleStatusChange(event) {
    const value = event.target.value;
    if (value === ticket.status) return;
    if (value === "closed") setConfirmClose(true);
    else save("status", value);
  }

  function handlePriorityChange(event) {
    const value = event.target.value;
    if (value !== ticket.priority) save("priority", value);
  }

  return (
    <Panel title="إدارة التذكرة">
      <FormField label="الحالة" hint={busyField === "status" ? "جاري الحفظ..." : undefined}>
        <select
          className="dash-input"
          value={ticket.status}
          disabled={Boolean(busyField)}
          onChange={handleStatusChange}
        >
          {TICKET_STATUSES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="الأولوية" hint={busyField === "priority" ? "جاري الحفظ..." : undefined}>
        <select
          className="dash-input"
          value={ticket.priority}
          disabled={Boolean(busyField)}
          onChange={handlePriorityChange}
        >
          {TICKET_PRIORITIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>

      {error ? (
        <div className="dash-alert is-danger support-flush" role="alert">
          <CircleAlert size={18} aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmClose}
        title="إغلاق التذكرة؟"
        message="بعد الإغلاق مش هيقدر صاحب التذكرة ولا إنت تبعتوا رسائل جديدة، لكن تقدر تفتحها تاني بتغيير الحالة."
        confirmLabel="إغلاق التذكرة"
        danger
        loading={busyField === "status"}
        onConfirm={() => save("status", "closed")}
        onCancel={() => setConfirmClose(false)}
      />
    </Panel>
  );
}
