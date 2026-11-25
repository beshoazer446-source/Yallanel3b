import { CircleAlert, CircleCheck, MapPinned, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ConfirmDialog from "../../components/dashboard/ui/ConfirmDialog";
import EmptyState from "../../components/dashboard/ui/EmptyState";
import PageHeader from "../../components/dashboard/ui/PageHeader";
import CourtCard from "../../components/owner/CourtCard";
import { useAuth } from "../../context/useAuth";
import {
  getOwnerVenuesWithImages,
  getVenueBookingInfo,
  resubmitVenue,
  setVenueActive,
} from "../../services/venuesService";

function countLabel(count) {
  if (count === 1) return "عندك ملعب واحد";
  if (count === 2) return "عندك ملعبين";
  if (count <= 10) return `عندك ${count} ملاعب`;
  return `عندك ${count} ملعبًا`;
}

export default function OwnerCourtsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [courtToHide, setCourtToHide] = useState(null);

  // الفورم بيبعت اسم الملعب بعد الحفظ
  const savedName = location.state?.venueSaved;

  useEffect(() => {
    let active = true;

    getOwnerVenuesWithImages(user.id)
      .then((data) => {
        if (active) setCourts(data);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "تعذر تحميل الملاعب.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user.id]);

  function dismissSavedNotice() {
    navigate(location.pathname, { replace: true, state: null });
  }

  async function changeActive(court, isActive) {
    setBusyId(court.id);
    setActionError("");

    try {
      if (isActive) {
        // الفورم بيمنع عرض ملعب من غير مواعيد وطريقة دفع، فنفس الشرط هنا
        const info = await getVenueBookingInfo(court.id);
        if (!info.workingHours.length || !info.paymentMethods.length) {
          setActionError(
            `لا يمكن إظهار «${court.name}» قبل إضافة مواعيد العمل وطريقة دفع واحدة على الأقل من صفحة التعديل.`,
          );
          return;
        }
      }

      const updated = await setVenueActive({
        venueId: court.id,
        ownerId: user.id,
        isActive,
      });
      setCourts((current) =>
        current.map((item) =>
          item.id === court.id ? { ...item, is_active: updated.is_active } : item,
        ),
      );
    } catch (changeError) {
      setActionError(changeError.message || "تعذر تحديث حالة الملعب.");
    } finally {
      setBusyId(null);
      setCourtToHide(null);
    }
  }

  function handleToggle(court) {
    if (court.is_active) {
      setCourtToHide(court); // الإخفاء بيطلب تأكيد
    } else {
      changeActive(court, true);
    }
  }
    async function handleResubmit(court) {
      setBusyId(court.id);
      setActionError("");
      try {
        await resubmitVenue(court.id);
        setCourts((current) =>
          current.map((item) =>
            item.id === court.id
              ? {
                  ...item,
                  approval_status: "pending_review",
                  rejection_reason: null,
                }
              : item,
          ),
        );
      } catch (resubmitError) {
        setActionError(resubmitError.message || "تعذر إعادة الإرسال.");
      } finally {
        setBusyId(null);
      }
    }

  const addButton = (
    <Link to="/owner/courts/new" className="dash-btn dash-btn-primary">
      <Plus size={18} aria-hidden="true" />
      إضافة ملعب
    </Link>
  );

  let content = null;
  if (loading) {
    content = <p className="dash-muted">جاري تحميل الملاعب...</p>;
  } else if (courts.length === 0) {
    if (!error) {
      content = (
        <EmptyState
          icon={MapPinned}
          title="لسه ما أضفتش أي ملعب"
          description="أضف ملعبك الأول عشان يظهر للاعبين ويقدروا يحجزوه."
          action={
            <Link to="/owner/courts/new" className="dash-btn dash-btn-primary">
              <Plus size={18} aria-hidden="true" />
              أضف ملعبك الأول
            </Link>
          }
        />
      );
    }
  } else {
    content = (
      <>
        <PageHeader title={countLabel(courts.length)} action={addButton} />
        <div
          className={`dash-court-grid${courts.length === 1 ? " is-single" : ""}`}
        >
          {courts.map((court) => (
            <CourtCard
              key={court.id}
              court={court}
              featured={courts.length === 1}
              busy={busyId === court.id}
              onToggleActive={handleToggle}
              onResubmit={handleResubmit}
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      {savedName ? (
        <div className="dash-alert is-success" role="status">
          <CircleCheck size={18} aria-hidden="true" />
          <span>تم حفظ «{savedName}» بنجاح.</span>
          <button
            type="button"
            className="dash-alert-close"
            onClick={dismissSavedNotice}
            aria-label="إغلاق الرسالة"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="dash-alert is-danger" role="alert">
          <CircleAlert size={18} aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      {actionError ? (
        <div className="dash-alert is-danger" role="alert">
          <CircleAlert size={18} aria-hidden="true" />
          <span>{actionError}</span>
          <button
            type="button"
            className="dash-alert-close"
            onClick={() => setActionError("")}
            aria-label="إغلاق الرسالة"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {content}

      <ConfirmDialog
        open={Boolean(courtToHide)}
        title={courtToHide ? `إخفاء «${courtToHide.name}»؟` : ""}
        message="الملعب هيختفي من قايمة اللاعبين ومش هيقدروا يحجزوه. الحجوزات الحالية بتفضل سارية، وتقدر تظهره تاني في أي وقت."
        confirmLabel="إخفاء الملعب"
        danger
        loading={busyId !== null && courtToHide?.id === busyId}
        onConfirm={() => changeActive(courtToHide, false)}
        onCancel={() => setCourtToHide(null)}
      />
    </>
  );
}