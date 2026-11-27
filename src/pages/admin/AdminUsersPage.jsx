import { useState } from "react";
import {
  getAdminUsers,
  reactivateUser,
  suspendUser,
  updateUserProfile,
} from "../../services/adminService";
import {
  btnSm,
  runAction,
  tableWrap,
  td,
  th,
  toolbar,
  useAdminData,
} from "./adminShared";

export default function AdminUsersPage() {
  const { data, error, reload } = useAdminData(getAdminUsers);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");

  if (error)
    return (
      <p role="alert" style={{ color: "var(--status-cancelled)" }}>
        {error}
      </p>
    );
  if (!data) return <p>جاري التحميل...</p>;

  const term = search.trim().toLowerCase();
  const rows = data.filter(
    (u) =>
      (role === "all" || u.role === role) &&
      (!term ||
        [u.name, u.email, u.phone]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(term))),
  );

  function edit(user) {
    const name = window.prompt("الاسم:", user.name);
    if (name === null) return;
    const phone = window.prompt("رقم الهاتف:", user.phone || "");
    if (phone === null) return;
    runAction(() => updateUserProfile(user.id, name, phone), reload);
  }

  function toggle(user) {
    const msg = user.is_active
      ? `إيقاف حساب ${user.name}؟`
      : `إعادة تفعيل حساب ${user.name}؟`;
    if (!window.confirm(msg)) return;
    runAction(
      () => (user.is_active ? suspendUser(user.id) : reactivateUser(user.id)),
      reload,
    );
  }

  return (
    <div>
      <div style={toolbar}>
        <input
          className="auth-input"
          placeholder="بحث بالاسم أو الإيميل أو الهاتف"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <select
          className="auth-input"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{ maxWidth: 160 }}
        >
          <option value="all">الكل</option>
          <option value="user">لاعبون</option>
          <option value="owner">أونرز</option>
        </select>
      </div>

      {rows.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>لا توجد نتائج.</p>
      ) : (
        <div className="card" style={tableWrap}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>الاسم</th>
                <th style={th}>الإيميل</th>
                <th style={th}>الهاتف</th>
                <th style={th}>النوع</th>
                <th style={th}>الحالة</th>
                <th style={th}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td style={td}>{u.name}</td>
                  <td style={td} dir="ltr">
                    {u.email}
                  </td>
                  <td style={td} dir="ltr">
                    {u.phone || "—"}
                  </td>
                  <td style={td}>{u.role === "owner" ? "أونر" : "لاعب"}</td>
                  <td style={td}>{u.is_active ? "نشط" : "موقوف"}</td>
                  <td style={td}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={btnSm}
                      onClick={() => edit(u)}
                    >
                      تعديل
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ ...btnSm, color: u.is_active ? "var(--status-cancelled)" : "var(--status-success)", borderColor: u.is_active ? "var(--status-cancelled)" : "var(--status-success)" }}
                      onClick={() => toggle(u)}
                    >
                      {u.is_active ? "إيقاف" : "تفعيل"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
