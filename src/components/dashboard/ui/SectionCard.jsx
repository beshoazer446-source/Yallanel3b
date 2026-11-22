// كارت قسم في الفورم: عنوان + سطر شرح + المحتوى
export default function SectionCard({ title, description, children }) {
  return (
    <section className="dash-section-card">
      <header className="dash-section-head">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </header>
      {children}
    </section>
  );
}
