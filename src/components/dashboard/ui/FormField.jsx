// حقل فورم: العنوان + الحقل نفسه (children) + تلميح + رسالة خطأ.
// الحقل جوه <label> فالعنوان مربوط بيه تلقائيًا.
export default function FormField({
  label,
  required = false,
  hint,
  error,
  className = "",
  children,
}) {
  return (
    <label className={`dash-field ${className}`.trim()}>
      <span className="dash-label">
        {label}
        {required ? (
          <span className="dash-required" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </span>
      {children}
      {hint ? <span className="dash-hint">{hint}</span> : null}
      {error ? (
        <span className="dash-field-error" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
