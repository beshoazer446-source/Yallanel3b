import "../../dashboard-ui.css";
import "./support.css";

// غلاف الصفحة. dashboard: جوه الداشبورد (الهيدر موجود). site: جوه MainLayout فبنضيف عنوان وcontainer.
export default function SupportShell({ variant = "dashboard", title, children }) {
  if (variant === "site") {
    return (
      <section className="container support-site">
        <h1 className="support-site-title">{title}</h1>
        <div className="support-page">{children}</div>
      </section>
    );
  }
  return <div className="support-page">{children}</div>;
}
