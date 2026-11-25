import { CircleAlert } from "lucide-react";

// حالة خطأ بنفس شكل EmptyState + زرار إعادة المحاولة
export default function ErrorState({
  title = "حدث خطأ",
  message,
  onRetry,
  retrying = false,
}) {
  return (
    <div className="dash-empty" role="alert">
      <span className="dash-empty-icon">
        <CircleAlert size={32} aria-hidden="true" />
      </span>
      <h2 className="dash-empty-title">{title}</h2>
      {message ? <p className="dash-empty-desc">{message}</p> : null}
      {onRetry ? (
        <button
          type="button"
          className="dash-btn dash-btn-primary"
          onClick={onRetry}
          disabled={retrying}
        >
          {retrying ? "جاري المحاولة..." : "إعادة المحاولة"}
        </button>
      ) : null}
    </div>
  );
}