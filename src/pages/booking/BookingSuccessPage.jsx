import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import "./BookingSuccess.css";

/*
  الصفحة دي بتتفتح بعد ما اليوزر يرجع من Paymob (أو بعد "ادفع في الملعب").
  الرابط فيه ?ref=... وده مرجع الطلب اللي اتسجّل في bookings.payment_ref

  مهم: الـ URL ممكن أي حد يعدله بإيده، فالحالة الحقيقية بتتاخد من الداتابيز.
  الـ URL (success / pending اللي Paymob بيضيفهم) بنستخدمه بس عشان نعرف نستنى الـ webhook ولا لأ.
*/

const STATES = {
    success: {
        icon: "✓",
        title: "تم تأكيد حجزك",
        text: "تم استلام العربون وحجزنا لك الميعاد. نشوفك في الملعب!",
    },
    confirming: {
        icon: "…",
        title: "جاري تأكيد الدفع",
        text: "استلمنا الدفع وبنأكد الحجز دلوقتي، ثواني وهيظهر هنا.",
    },
    pending: {
        icon: "…",
        title: "في انتظار الدفع",
        text: "الحجز محفوظ مؤقتًا لحد ما الدفع يتأكد.",
    },
    venue: {
        icon: "⌛",
        title: "في انتظار تأكيد صاحب الملعب",
        text: "طلبك اتبعت لصاحب الملعب، وهيوصلك تأكيد بعد ما يراجع الحجز. الحجز بيتحفظ 24 ساعة.",
    },
    failed: {
        icon: "!",
        title: "الحجز ماتمش",
        text: "حصلت مشكلة وماتأكدش الدفع. تقدر ترجع وتجرب تاني.",
    },
};

const MAX_POLLS = 10; // نستنى الـ webhook لحد 30 ثانية
const POLL_EVERY_MS = 3000;

function resolveState(rows, params) {
    // Paymob بيرجّع success=true|false و pending=true|false في الرابط
    const paidInUrl = params.get("success") === "true";
    const pendingInUrl = params.get("pending") === "true";
    const failedInUrl = params.get("success") === "false" && !pendingInUrl;

    if (rows.some((row) => row.status === "confirmed")) return "success";
    if (failedInUrl) return "failed";

    if (
        rows.length > 0 &&
        rows.every((row) => row.status === "cancelled" || row.status === "rejected")
    ) {
        return "failed";
    }

    if (rows[0]?.payment_method === "venue" || params.get("method") === "venue") {
        return "venue";
    }

    if (paidInUrl) return "confirming";

    return "pending";
}

export default function BookingSuccess() {
    const [params] = useSearchParams();
    const ref = params.get("ref");
    const paidInUrl = params.get("success") === "true";

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(Boolean(ref));

    useEffect(() => {
        if (!ref) return;

        let cancelled = false;
        let polls = 0;
        let timer;

        async function load() {
            const { data, error } = await supabase.rpc("get_booking_by_ref", {
                p_ref: ref,
            });

            if (cancelled) return;

            if (error) console.error("Booking fetch error:", error);

            const found = data || [];
            setRows(found);
            setLoading(false);

            // لو رجع من الدفع بنجاح والـ webhook لسه ما أكدش، نحاول تاني كام مرة
            const confirmed = found.some((row) => row.status === "confirmed");
            polls += 1;

            if (!confirmed && paidInUrl && polls < MAX_POLLS) {
                timer = setTimeout(load, POLL_EVERY_MS);
            }
        }

        load();

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [ref, paidInUrl]);

    if (loading) {
        return (
            <main className="success-page" dir="rtl">
                <div className="success-card">
                    <p className="success-loading">جاري التأكد من حالة الحجز...</p>
                </div>
            </main>
        );
    }

    const stateKey = resolveState(rows, params);
    const state = STATES[stateKey];

    const sorted = [...rows].sort((a, b) => a.start_time.localeCompare(b.start_time));
    const first = sorted[0];
    const deposit = rows.reduce((sum, row) => sum + Number(row.deposit_amount || 0), 0);

    return (
        <main className="success-page" dir="rtl">
            <div className="success-card">
                <div className={`success-icon icon-${stateKey === "confirming" ? "pending" : stateKey}`} aria-hidden="true">
                    {state.icon}
                </div>

                <h1 className="success-title">{state.title}</h1>
                <p className="success-text">{state.text}</p>

                {first && (
                    <div className="success-details">
                        <div className="success-row">
                            <span>الملعب</span>
                            <strong>{first.venue_name}</strong>
                        </div>

                        <div className="success-row">
                            <span>التاريخ</span>
                            <strong className="success-ltr">{first.date}</strong>
                        </div>

                        <div className="success-row">
                            <span>الموعد</span>
                            <strong className="success-ltr">
                                {sorted.map((row) => (
                                    <div key={`${row.start_time}-${row.end_time}`}>
                                        {row.start_time.slice(0, 5)} - {row.end_time.slice(0, 5)}
                                    </div>
                                ))}
                            </strong>
                        </div>

                        <div className="success-row">
                            <span>العربون</span>
                            <strong>{deposit.toFixed(2)} جنيه</strong>
                        </div>
                    </div>
                )}

                <div className="success-actions">
                    {stateKey === "failed" && first?.venue_id ? (
                        <Link
                            className="success-btn success-btn-primary"
                            to={`/booking/${first.venue_id}`}
                        >
                            جرّب الحجز تاني
                        </Link>
                    ) : (
                        <Link className="success-btn success-btn-primary" to="/my-bookings">
                            حجوزاتي
                        </Link>
                    )}

                    <Link className="success-btn success-btn-outline" to="/">
                        الرئيسية
                    </Link>
                </div>
            </div>
        </main>
    );
}