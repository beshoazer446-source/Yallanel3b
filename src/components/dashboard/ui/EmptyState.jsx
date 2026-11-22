// حالة فاضية: أيقونة + عنوان + وصف + زرار اختياري
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="dash-empty">
      {Icon ? (
        <span className="dash-empty-icon">
          <Icon size={32} aria-hidden="true" />
        </span>
      ) : null}
      <h2 className="dash-empty-title">{title}</h2>
      {description ? <p className="dash-empty-desc">{description}</p> : null}
      {action}
    </div>
  );
}
