// كارت بعنوان وزرار اختياري على الجنب
export default function Panel({ title, description, action, children, className = "" }) {
  return (
    <section className={`dash-panel ${className}`.trim()}>
      <header className="dash-panel-head">
        <div>
          <h2 className="dash-panel-title">{title}</h2>
          {description ? <p className="dash-panel-desc">{description}</p> : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
