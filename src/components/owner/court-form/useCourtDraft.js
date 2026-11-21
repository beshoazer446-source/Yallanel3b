import { useEffect, useRef, useState } from "react";

function hasStoredDraft(key) {
  try {
    return Boolean(localStorage.getItem(key));
  } catch {
    return false;
  }
}

// منطق مسودة الفورم (localStorage): حفظ، استعادة، تجاهل، مسح
export default function useCourtDraft({ storageKey, getSnapshot, applySnapshot }) {
  const [hasDraft, setHasDraft] = useState(() => hasStoredDraft(storageKey));
  const [notice, setNotice] = useState("");
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  function showNotice(message, duration = 4000) {
    clearTimeout(timerRef.current);
    setNotice(message);
    timerRef.current = setTimeout(() => setNotice(""), duration);
  }

  function saveDraft() {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ ...getSnapshot(), savedAt: new Date().toISOString() }),
      );
      showNotice("تم حفظ المسودة في متصفحك. الصورة ما بتتحفظش فيها.", 5000);
    } catch {
      showNotice("تعذر حفظ المسودة في متصفحك.");
    }
  }

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      applySnapshot(JSON.parse(raw));
      setHasDraft(false);
      showNotice("تم استعادة المسودة.");
    } catch {
      showNotice("تعذر قراءة المسودة المحفوظة.");
    }
  }

  function discardDraft() {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // مش مشكلة
    }
    setHasDraft(false);
    showNotice("تم تجاهل المسودة.", 3000);
  }

  function clearDraft() {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // مش مشكلة
    }
  }

  return { hasDraft, notice, saveDraft, restoreDraft, discardDraft, clearDraft };
}
