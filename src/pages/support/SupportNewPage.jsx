import { ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import NewTicketForm from "../../components/support/NewTicketForm";
import SupportShell from "../../components/support/SupportShell";
import { useAuth } from "../../context/useAuth";

export default function SupportNewPage({ basePath, variant = "dashboard" }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  return (
    <SupportShell variant={variant} title="تذكرة دعم جديدة">
      <Link to={basePath} className="support-back">
        <ArrowRight size={16} aria-hidden="true" />
        العودة لتذاكري
      </Link>

      <NewTicketForm
        currentUser={{ id: user.id, role: profile?.role }}
        basePath={basePath}
        onCreated={(ticket) => navigate(`${basePath}/${ticket.id}`, { replace: true })}
      />
    </SupportShell>
  );
}
