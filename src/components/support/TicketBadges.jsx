import { TICKET_PRIORITIES, TICKET_STATUSES, getOption } from "./supportConstants";

export function TicketStatusBadge({ status }) {
  const option = getOption(TICKET_STATUSES, status) ?? { label: status, tone: "muted" };
  return <span className={`dash-badge is-${option.tone}`}>{option.label}</span>;
}

export function PriorityBadge({ priority }) {
  const option = getOption(TICKET_PRIORITIES, priority) ?? { label: priority, tone: "muted" };
  return <span className={`dash-badge is-${option.tone}`}>{option.label}</span>;
}
