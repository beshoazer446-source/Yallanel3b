// سطر عنوان فرعي أعلى محتوى الصفحة، وعلى جنبه زرار أو أي عنصر (action)
export default function PageHeader({ title, description, action }) {
  return (
    <div className="dash-page-header">
      <div>
        <h2 className="dash-page-header-title">{title}</h2>
        {description ? (
          <p className="dash-page-header-desc">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
