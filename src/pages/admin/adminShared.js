import { useCallback, useEffect, useState } from "react";

// loader لازم يكون دالة ثابتة (من برة الكومبوننت)
export function useAdminData(loader) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setError("");
      setData(await loader());
    } catch (e) {
      setError(e.message || "تعذر تحميل البيانات.");
    }
  }, [loader]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, reload };
}

export async function runAction(action, reload) {
  try {
    await action();
    await reload();
  } catch (e) {
    window.alert(e.message || "فشلت العملية.");
  }
}

export function askReason(message) {
  const value = window.prompt(message);
  return value && value.trim() ? value.trim() : null;
}

export const th = {
  textAlign: "right",
  padding: "10px 12px",
  color: "var(--text-muted)",
  fontWeight: 600,
  whiteSpace: "nowrap",
};
export const td = {
  padding: "10px 12px",
  borderTop: "1px solid var(--border, #e5e7eb)",
  verticalAlign: "middle",
};
export const tableWrap = { overflowX: "auto" };
export const toolbar = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 16,
};
export const btnSm = {
  padding: "4px 10px",
  fontSize: 13,
  marginInlineStart: 6,
};
