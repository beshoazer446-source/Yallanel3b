import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import "./BookingPage.css";

const DEPOSIT_PERCENT = 25;

// ⚠️ للتجربة فقط: true = مايحوّلش على /login لو اليوزر مش مسجّل دخول.
// لازم تبقى false قبل العرض أو قبل ما الموقع يتنشر.
const DEV_SKIP_LOGIN = true;

// الأوقات من الداتابيز بتيجي "08:00:00" فبناخد أول 5 حروف بس
function timeToMinutes(time) {
    const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
    return hours * 60 + minutes;
}

// وقت النهاية "00:00" معناه نهاية اليوم
function endToMinutes(time) {
    const minutes = timeToMinutes(time);
    return minutes === 0 ? 24 * 60 : minutes;
}

function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export default function BookingPage() {
    const { venueId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [venue, setVenue] = useState(null);
    const [allHours, setAllHours] = useState([]);
    const [loading, setLoading] = useState(true);

    const [date, setDate] = useState(getToday());
    const [bookedSlots, setBookedSlots] = useState([]);
    const [reloadKey, setReloadKey] = useState(0);

    const [selectedSlots, setSelectedSlots] = useState([]);
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);
    const [isPaying, setIsPaying] = useState(false);

    function showMessage(text, error = false) {
        setMessage(text);
        setIsError(error);
    }

    // ---------- الملعب وساعات الشغل ----------
    useEffect(() => {
        let cancelled = false;

        async function loadVenue() {
            setLoading(true);

            const { data: venueData, error: venueError } = await supabase
                .from("venues")
                .select(
                    "id, name, city, area, address, price_per_hour, slot_minutes, amenities"
                )
                .eq("id", venueId)
                .eq("is_active", true)
                .maybeSingle();

            if (cancelled) return;

            if (venueError) console.error("Venue fetch error:", venueError);

            if (!venueData) {
                setVenue(null);
                setLoading(false);
                return;
            }

            const { data: hoursData, error: hoursError } = await supabase
                .from("venue_working_hours")
                .select("day_of_week, open_time, close_time")
                .eq("venue_id", venueData.id);

            if (cancelled) return;

            if (hoursError) console.error("Working hours fetch error:", hoursError);

            setVenue(venueData);
            setAllHours(hoursData || []);
            setLoading(false);
        }

        loadVenue();

        return () => {
            cancelled = true;
        };
    }, [venueId]);

    // ---------- المواعيد المحجوزة في اليوم المختار ----------
    useEffect(() => {
        if (!venue) return;

        let cancelled = false;

        async function loadBookedSlots() {
            const { data, error } = await supabase.rpc("get_booked_slots", {
                p_venue_id: venue.id,
                p_date: date,
            });

            if (cancelled) return;

            if (error) console.error("Booked slots error:", error);

            const booked = data || [];
            setBookedSlots(booked);

            // لو واحد من المواعيد اللي اخترتها اتحجز في الأثناء، نشيله من الاختيار
            setSelectedSlots((current) =>
                current.filter((slot) => {
                    const start = timeToMinutes(slot.start);
                    const end = slot.end === "24:00" ? 24 * 60 : timeToMinutes(slot.end);

                    return !booked.some(
                        (b) => start < endToMinutes(b.end_time) && end > timeToMinutes(b.start_time)
                    );
                })
            );
        }

        loadBookedSlots();

        return () => {
            cancelled = true;
        };
    }, [venue, date, reloadKey]);

    function toggleSlot(slot) {
        setSelectedSlots((currentSlots) => {
            const alreadySelected = currentSlots.some(
                (item) => item.start === slot.start && item.end === slot.end
            );

            if (alreadySelected) {
                return currentSlots.filter(
                    (item) => item.start !== slot.start || item.end !== slot.end
                );
            }

            // نرتب المواعيد عشان تظهر في الملخص بالترتيب
            return [...currentSlots, slot].sort((a, b) =>
                a.start.localeCompare(b.start)
            );
        });
    }

    const workingHours = useMemo(() => {
        if (!date) return [];

        const dayOfWeek = new Date(`${date}T12:00:00`).getDay();

        return allHours.filter((item) => item.day_of_week === dayOfWeek);
    }, [allHours, date]);

    const slots = useMemo(() => {
        if (!venue || !date) return [];

        const duration = venue.slot_minutes || 60;
        const availableSlots = [];

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        workingHours.forEach((period) => {
            const openMinutes = timeToMinutes(period.open_time);
            const closeMinutes = endToMinutes(period.close_time);

            for (
                let start = openMinutes;
                start + duration <= closeMinutes;
                start += duration
            ) {
                const end = start + duration;

                const isBooked = bookedSlots.some(
                    (booked) =>
                        start < endToMinutes(booked.end_time) &&
                        end > timeToMinutes(booked.start_time)
                );

                const isPast = date === getToday() && start <= currentMinutes;

                availableSlots.push({
                    start: minutesToTime(start),
                    end: minutesToTime(end),
                    isBooked,
                    isPast,
                });
            }
        });

        // لو في أكتر من فترة (صباحية ومسائية) نضمن الترتيب
        return availableSlots.sort((a, b) => a.start.localeCompare(b.start));
    }, [venue, date, workingHours, bookedSlots]);

    if (loading) {
        return (
            <main className="booking-page" dir="rtl">
                <div className="booking-card">
                    <p>جاري تحميل بيانات الملعب...</p>
                </div>
            </main>
        );
    }

    if (!venue) {
        return (
            <main className="booking-page" dir="rtl">
                <div className="booking-card">
                    <h2>الملعب غير موجود</h2>
                    <p>تأكد من رابط الصفحة ورقم الملعب.</p>
                </div>
            </main>
        );
    }

    const hasSelection = selectedSlots.length > 0;
    const price = venue.price_per_hour * selectedSlots.length;
    const deposit = (price * DEPOSIT_PERCENT) / 100;

    function handleDateChange(event) {
        setDate(event.target.value);
        setSelectedSlots([]);
        showMessage("");
    }

    async function handleBooking(paymentType) {
        if (!hasSelection) {
            showMessage("اختار موعدًا أولًا.", true);
            return;
        }

        if (isPaying) return;

        setIsPaying(true);
        showMessage(
            paymentType === "venue" ? "جاري تسجيل الحجز..." : "جاري تجهيز الدفع..."
        );

        // لازم اليوزر يكون مسجّل دخول
        const { data: sessionData } = await supabase.auth.getSession();

        if (!DEV_SKIP_LOGIN && !sessionData?.session) {
            setIsPaying(false);
            navigate("/login", { state: { from: location.pathname } });
            return;
        }

        const { data, error } = await supabase.functions.invoke("paymob-payment", {
            body: {
                venue_id: venue.id,
                date,
                slots: selectedSlots.map(({ start, end }) => ({ start, end })),
                payment_type: paymentType,
            },
        });

        if (error || data?.error) {
            console.error("paymob-payment error:", error, data);

            showMessage(
                data?.error || error?.message || "حصلت مشكلة، جرّب تاني.",
                true
            );
            setIsPaying(false);
            // نحدّث المواعيد المحجوزة (ممكن حد سبقك على ميعاد)
            setReloadKey((key) => key + 1);

            return;
        }

        if (paymentType === "venue" && data?.redirect_path) {
            navigate(data.redirect_path);
            return;
        }

        if (data?.checkout_url) {
            window.location.href = data.checkout_url;
            return;
        }

        showMessage("الطلب وصل، لكن رابط الدفع مش موجود.", true);
        setIsPaying(false);
    }

    return (
        <main className="booking-page" dir="rtl">
            <header className="booking-header">
                <span className="booking-eyebrow">
                    احجز ملعبك بسهولة
                </span>
                <h1>حجز ملعب</h1>
                <p>اختار اليوم والموعد المناسب ليك.</p>
            </header>

            <section className="booking-card venue-card">
                <div className="venue-heading">
                    <div>
                        <h2>{venue.name}</h2>
                        <p className="venue-location">
                            {venue.city} - {venue.area}
                        </p>
                        {venue.address && (
                            <p className="venue-location">{venue.address}</p>
                        )}
                    </div>
                </div>

                {venue.amenities?.length > 0 && (
                    <ul className="venue-amenities">
                        {venue.amenities.map((item) => (
                            <li key={item} className="amenity-chip">
                                {item}
                            </li>
                        ))}
                    </ul>
                )}

                <div className="venue-price">
                    <span>سعر الساعة</span>
                    <strong>{venue.price_per_hour} جنيه</strong>
                </div>

                <div className="deposit-info">
                    العربون المطلوب: {DEPOSIT_PERCENT}% من إجمالي الحجز
                </div>
            </section>

            <section className="booking-card">
                <h2 className="section-title">اختار تاريخ الحجز</h2>

                <label className="field-label" htmlFor="booking-date">
                    تاريخ الحجز
                </label>

                <input
                    id="booking-date"
                    className="date-input"
                    type="date"
                    min={getToday()}
                    value={date}
                    onChange={handleDateChange}
                />

                <div className="slots-heading">
                    <h2 className="section-title">المواعيد المتاحة</h2>
                    <span className="slots-date">{date}</span>
                </div>

                <div className="slots-legend">
                    <span>
                        <i className="legend-dot available-dot" />
                        متاح
                    </span>
                    <span>
                        <i className="legend-dot selected-dot" />
                        اخترته
                    </span>
                    <span>
                        <i className="legend-dot booked-dot" />
                        محجوز
                    </span>
                    <span>
                        <i className="legend-dot past-dot" />
                        غير متاح
                    </span>
                </div>

                {workingHours.length === 0 ? (
                    <div className="empty-slots">
                        الملعب مش متاح اليوم دا جرب يوم تاني
                    </div>
                ) : slots.length === 0 ? (
                    <div className="empty-slots">
                        مفيش مواعيد كاملة متاحة في اليوم ده.
                    </div>
                ) : (
                    <div className="booking-slots">
                        {slots.map((slot) => {
                            const disabled = slot.isBooked || slot.isPast;
                            const selected = selectedSlots.some(
                                (item) => item.start === slot.start && item.end === slot.end
                            );

                            let statusText = "متاح";
                            if (slot.isBooked) statusText = "محجوز";
                            else if (slot.isPast) statusText = "غير متاح";
                            else if (selected) statusText = "تم الاختيار";

                            return (
                                <button
                                    key={`${slot.start}-${slot.end}`}
                                    type="button"
                                    disabled={disabled}
                                    aria-pressed={selected}
                                    className={[
                                        "slot-button",
                                        slot.isBooked ? "slot-booked" : "",
                                        slot.isPast ? "slot-past" : "",
                                        selected ? "slot-selected" : "",
                                    ].filter(Boolean).join(" ")}
                                    onClick={() => {
                                        toggleSlot(slot);
                                        showMessage("");
                                    }}
                                >
                                    <span className="slot-time">
                                        {slot.start} - {slot.end}
                                    </span>
                                    <span className="slot-status">
                                        {statusText}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>

            <section className="booking-card summary-card">
                <h2 className="section-title">ملخص الحجز</h2>

                <div className="summary-row">
                    <span>الملعب</span>
                    <strong>{venue.name}</strong>
                </div>

                <div className="summary-row">
                    <span>التاريخ</span>
                    <strong>{date}</strong>
                </div>

                <div className="summary-row">
                    <span>الموعد</span>
                    <strong>
                        {!hasSelection ? (
                            "لم يتم اختيار أي ميعاد بعد"
                        ) : (
                            selectedSlots.map((slot) => (
                                <div key={`${slot.start}-${slot.end}`}>
                                    {slot.start} - {slot.end}
                                </div>
                            ))
                        )}
                    </strong>
                </div>

                <div className="summary-row">
                    <span>السعر الإجمالي</span>
                    <strong>{hasSelection ? `${price} جنيه` : "—"}</strong>
                </div>

                <div className="summary-row summary-deposit">
                    <span>العربون المطلوب ({DEPOSIT_PERCENT}%)</span>
                    <strong>
                        {hasSelection ? `${deposit.toFixed(2)} جنيه` : "—"}
                    </strong>
                </div>

                <button
                    type="button"
                    className="confirm-booking-button"
                    onClick={() => handleBooking("online")}
                    disabled={!hasSelection || isPaying}
                >
                    {isPaying ? "جاري التحويل..." : "ادفع العربون أونلاين"}
                </button>

                <button
                    type="button"
                    className="venue-pay-button"
                    onClick={() => handleBooking("venue")}
                    disabled={!hasSelection || isPaying}
                >
                    ادفع في الملعب
                </button>

                <p className="venue-pay-hint">
                    لو اخترت الدفع في الملعب، الميعاد بيتحفظ 24 ساعة في انتظار تأكيد صاحب الملعب.
                </p>

                {message && (
                    <p
                        className={`booking-message${isError ? " is-error" : ""}`}
                        role="status"
                    >
                        {message}
                    </p>
                )}

                <p className="demo-notice">
                    الدفع في وضع تجريبي ومفيش أي فلوس هتتسحب.
                </p>
            </section>
        </main>
    );
}