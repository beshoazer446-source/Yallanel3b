import { useEffect, useRef } from "react";

// بينادي callback كل intervalMs. بيقف لما التبويب يتخفي،
// ولما يرجع ظاهر بينادي callback فورًا ويكمل.
export default function usePolling(callback, intervalMs, enabled = true) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;
    let timer = null;

    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
    }

    function start() {
      stop();
      timer = setInterval(() => {
        if (document.visibilityState === "visible") callbackRef.current();
      }, intervalMs);
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        callbackRef.current();
        start();
      } else {
        stop();
      }
    }

    start();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [intervalMs, enabled]);
}
