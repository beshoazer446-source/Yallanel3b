import { Check, CheckCheck, CircleAlert, Lock, MessageSquare, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../../dashboard-ui.css";
import usePolling from "../../hooks/usePolling";
import { getMessages, markMessagesRead, sendMessage } from "../../services/supportService";
import Skeleton from "../dashboard/ui/Skeleton";
import { formatDayLabel, formatTimeOfDay, mergeMessages, sameMessages } from "./supportUtils";
import "./support.css";

const POLL_MS = 12000;
const MAX_LENGTH = 2000;

// شات التذكرة. مشترك بين الأدمن والأونر واللاعب.
// currentUser = { id, name, role }، وticketStatus جاي من الصفحة (عشان نقفل الإرسال لو closed).
// peerName = اسم الطرف التاني (للأدمن: اسم صاحب التذكرة، وللباقي: "فريق الدعم").
export default function TicketChat({
  ticketId,
  currentUser,
  ticketStatus,
  peerName = "فريق الدعم",
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [visible, setVisible] = useState(() => document.visibilityState === "visible");

  const listRef = useRef(null);
  const stickRef = useRef(true); // لو القارئ تحت، الرسايل الجديدة تنزّله
  const closed = ticketStatus === "closed";

  // التحميل الأول (وإعادة المحاولة)
  useEffect(() => {
    let active = true;

    getMessages(ticketId)
      .then((data) => {
        if (!active) return;
        setMessages(data);
        setError("");
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "تعذر تحميل الرسائل.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [ticketId, reloadKey]);

  // تحديث دوري بدون realtime
  const pollMessages = useCallback(async () => {
    try {
      const data = await getMessages(ticketId);
      setMessages((current) => {
        const merged = mergeMessages(current, data);
        return sameMessages(current, merged) ? current : merged;
      });
    } catch {
      // التحديث الدوري صامت، والمحاولة الجاية هتعوّض
    }
  }, [ticketId]);

  usePolling(pollMessages, POLL_MS, !loading && !error);

  // نعرف لو التبويب ظاهر (مش بنعلّم مقروء وهو متخفي)
  useEffect(() => {
    function handleVisibility() {
      setVisible(document.visibilityState === "visible");
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // تعليم رسائل الطرف التاني كمقروءة
  const hasUnreadIncoming = messages.some(
    (message) => message.sender_id !== currentUser.id && !message.is_read,
  );

  useEffect(() => {
    if (!hasUnreadIncoming || !visible) return undefined;
    let active = true;

    markMessagesRead({ ticketId, viewerId: currentUser.id })
      .then(() => {
        if (!active) return;
        setMessages((current) =>
          current.map((message) =>
            message.sender_id !== currentUser.id && !message.is_read
              ? { ...message, is_read: true }
              : message,
          ),
        );
      })
      .catch(() => {
        // لو فشل، هيتعاد مع أول تغيير في الرسائل
      });

    return () => {
      active = false;
    };
  }, [hasUnreadIncoming, visible, ticketId, currentUser.id]);

  // التمرير لآخر رسالة
  useEffect(() => {
    const element = listRef.current;
    if (element && stickRef.current) element.scrollTop = element.scrollHeight;
  }, [messages.length, loading]);

  function handleScroll() {
    const element = listRef.current;
    if (!element) return;
    stickRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
  }

  async function handleSend() {
    const body = text.trim();
    if (!body || sending || closed) return;

    setSending(true);
    setSendError("");
    try {
      const message = await sendMessage({ ticketId, senderId: currentUser.id, body });
      stickRef.current = true;
      setMessages((current) => mergeMessages(current, [message]));
      setText("");
    } catch (sendFailure) {
      setSendError(sendFailure.message || "تعذر إرسال الرسالة. حاول مرة أخرى.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      handleSend();
    }
  }

  // فواصل الأيام بين الرسائل
  const items = useMemo(() => {
    const result = [];
    let lastDay = "";
    for (const message of messages) {
      const day = formatDayLabel(message.created_at);
      if (day !== lastDay) {
        result.push({ type: "day", key: `day-${message.id}`, label: day });
        lastDay = day;
      }
      result.push({ type: "message", key: message.id, message });
    }
    return result;
  }, [messages]);

  let body = null;
  if (loading) {
    body = (
      <div className="support-chat-skeleton" aria-busy="true" aria-label="جاري تحميل الرسائل">
        <Skeleton height={56} width="60%" />
        <Skeleton height={56} width="50%" className="is-end" />
        <Skeleton height={56} width="65%" />
      </div>
    );
  } else if (error) {
    body = (
      <div className="dash-alert is-danger" role="alert">
        <CircleAlert size={18} aria-hidden="true" />
        <span>{error}</span>
        <button
          type="button"
          className="dash-btn dash-btn-secondary"
          onClick={() => {
            setLoading(true);
            setError("");
            setReloadKey((current) => current + 1);
          }}
        >
          إعادة المحاولة
        </button>
      </div>
    );
  } else if (items.length === 0) {
    body = (
      <p className="support-chat-empty">
        <MessageSquare size={28} aria-hidden="true" />
        لسه مفيش رسائل في التذكرة دي.
      </p>
    );
  } else {
    body = items.map((item) => {
      if (item.type === "day") {
        return (
          <span className="support-day" key={item.key}>
            {item.label}
          </span>
        );
      }

      const { message } = item;
      const mine = message.sender_id === currentUser.id;
      return (
        <div className={`support-msg ${mine ? "is-mine" : "is-theirs"}`} key={item.key}>
          <span className="support-msg-name">{mine ? "أنت" : peerName}</span>
          <div className="support-bubble">{message.body}</div>
          <span className="support-msg-time">
            {formatTimeOfDay(message.created_at)}
            {mine ? (
              message.is_read ? (
                <CheckCheck size={14} className="is-read" aria-label="تمت القراءة" />
              ) : (
                <Check size={14} aria-label="تم الإرسال" />
              )
            ) : null}
          </span>
        </div>
      );
    });
  }

  return (
    <section className="support-chat" aria-label="المحادثة">
      <div className="support-chat-list" ref={listRef} onScroll={handleScroll} role="log">
        {body}
      </div>

      <div className="support-composer">
        {closed ? (
          <p className="support-closed">
            <Lock size={16} aria-hidden="true" />
            التذكرة مغلقة ومش بتستقبل رسائل جديدة.
          </p>
        ) : (
          <>
            {sendError ? (
              <p className="dash-field-error" role="alert">
                {sendError}
              </p>
            ) : null}
            <div className="support-composer-row">
              <textarea
                className="dash-input"
                rows={2}
                value={text}
                maxLength={MAX_LENGTH}
                disabled={loading || Boolean(error) || sending}
                aria-label="نص الرسالة"
                placeholder="اكتب رسالتك... (Enter للإرسال، Shift+Enter لسطر جديد)"
                onChange={(event) => setText(event.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                type="button"
                className="dash-btn dash-btn-primary"
                onClick={handleSend}
                disabled={!text.trim() || sending || loading || Boolean(error)}
              >
                <Send size={16} className="support-send-icon" aria-hidden="true" />
                {sending ? "جاري الإرسال..." : "إرسال"}
              </button>
            </div>
            {text.length > MAX_LENGTH - 200 ? (
              <span className="dash-hint">
                {text.length} / {MAX_LENGTH}
              </span>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
