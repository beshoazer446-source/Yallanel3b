import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Map, MapPinned, FileText, UserLock } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { DEPOSIT_PERCENT } from "../../lib/constants";
import "./BookingPage.css";

// للتجربة فقط: true = مايحوّلش على /login لو اليوزر مش مسجّل دخول.
const DEV_SKIP_LOGIN = false;

function timeToMinutes(time) {
    const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
    return hours * 60 + minutes;
}

function endToMinutes(time) {
    const minutes = timeToMinutes(time);
    return minutes === 0 ? 24 * 60 : minutes;
}

function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function formatTime12(timeStr) {
    if (!timeStr) return "";
    const parts = timeStr.slice(0, 5).split(":");
    let hour = parseInt(parts[0], 10);
    const minutes = parts[1] || "00";
    const period = hour >= 12 ? "م" : "ص";
    if (hour === 0) hour = 12;
    else if (hour > 12) hour -= 12;
    return `${hour}:${minutes} ${period}`;
}

function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDateArabic(dateStr) {
    if (!dateStr) return "";
    try {
        const d = new Date(`${dateStr}T12:00:00`);
        const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
        return `${dayNames[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    } catch {
        return dateStr;
    }
}

export default function BookingPage() {
    const { venueId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [venue, setVenue] = useState(null);
    const [venueImage, setVenueImage] = useState(null);
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

    // ---------- الملعب وساعات الشغل والصور ----------
    useEffect(() => {
        let cancelled = false;

        async function loadVenue() {
            setLoading(true);

            const { data: venueData, error: venueError } = await supabase
                .from("venues")
                .select(
                    "id, name, city, area, address, maps_url, description, price_per_hour, slot_minutes, amenities, cancellation_hours"
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

            // جلب أول صورة للملعب (الصورة الرئيسية)
            try {
                const { data: imgData } = await supabase
                    .from("venue_images")
                    .select("image_url")
                    .eq("venue_id", venueData.id)
                    .order("sort_order")
                    .limit(1);

                if (!cancelled && imgData?.length > 0) {
                    setVenueImage(imgData[0].image_url);
                }
            } catch {
                // تجاهل خطأ الصورة
            }

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
    const slotDurationMinutes = venue.slot_minutes || 60;
    const totalDurationMinutes = slotDurationMinutes * selectedSlots.length;
    const totalDurationText = totalDurationMinutes >= 60
        ? `${Math.floor(totalDurationMinutes / 60)} ساعة${totalDurationMinutes % 60 > 0 ? ` و ${totalDurationMinutes % 60} دقيقة` : ""}`
        : `${totalDurationMinutes} دقيقة`;

    const price = venue.price_per_hour * selectedSlots.length;
    const deposit = (price * DEPOSIT_PERCENT) / 100;
    const remainingAtVenue = price - deposit;

    // استنتاج نوع الملعب من المميزات
    const pitchBadge = (() => {
        const am = (venue.amenities || []).join(" ");
        if (am.includes("11×11") || am.includes("قانوني")) return "ملعب قانوني 11×11";
        if (am.includes("8×8") || am.includes("ثماني")) return "ملعب ثماني 8×8";
        if (am.includes("7×7") || am.includes("سباعي")) return "ملعب سباعي 7×7";
        if (am.includes("5×5") || am.includes("خماسي")) return "ملعب خماسي 5×5";
        return null;
    })();

    // سياسة الإلغاء
    const cancellationHours = venue.cancellation_hours || 12;

    function handleDateChange(event) {
        setDate(event.target.value);
        setSelectedSlots([]);
        showMessage("");
    }

    async function handleBooking() {
        if (!hasSelection) {
            showMessage("اختار موعدًا أولًا.", true);
            return;
        }

        if (isPaying) return;

        setIsPaying(true);
        showMessage("جاري تجهيز الدفع...");

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
                payment_type: "online",
            },
        });

        if (error || data?.error) {
            console.error("paymob-payment error:", error, data);
            showMessage(
                data?.error || error?.message || "حصلت مشكلة، جرّب تاني.",
                true
            );
            setIsPaying(false);
            setReloadKey((key) => key + 1);
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

            {/* كارت بيانات الملعب */}
            <section className="booking-card booking-venue-card">
                {/* صورة الملعب الرئيسية */}
                {venueImage && (
                    <div className="venue-hero-img-wrap">
                        <img
                            src={venueImage}
                            alt={`صورة ${venue.name}`}
                            className="venue-hero-img"
                        />
                    </div>
                )}

                <div className="venue-heading">
                    <div>
                        <h2>{venue.name}</h2>
                        <p className="venue-location">
                            <MapPinned size={18} /> {[venue.city, venue.area, venue.address].filter(Boolean).join(" — ")}
                        </p>
                    </div>
                </div>

                {/* شارات: نوع الملعب والموقع */}
                <div className="venue-badges-row">
                    {pitchBadge && (
                        <span className="venue-badge pitch-badge">{pitchBadge}</span>
                    )}
                    {venue.maps_url && (
                        <a
                            href={venue.maps_url}
                            target="_blank"
                            rel="noreferrer"
                            className="venue-badge map-badge"
                        >
                            <Map size={20} /> الاتجاهات على الخريطة
                        </a>
                    )}
                </div>

                {/* الوصف */}
                {venue.description && (
                    <p className="venue-description">{venue.description}</p>
                )}

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
                    <strong>العربون المطلوب:</strong> {DEPOSIT_PERCENT}% من إجمالي الحجز (يُخصم من السعر الكلي)
                </div>

                {/* سياسة الإلغاء */}
                <div className="cancellation-policy">
                    <strong><FileText size={18} /> سياسة الإلغاء:</strong> يمكنك إلغاء الحجز المعلّق مجانًا قبل الميعاد بـ {cancellationHours} ساعة على الأقل من خلال صفحة "حجوزاتي". بعد تأكيد الحجز أو مرور المدة، لا يمكن الإلغاء.
                </div>
            </section>

            {/* كارت اختيار التاريخ والمواعيد */}
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

                {date && (
                    <p style={{ marginTop: 6, fontSize: 13, color: "var(--text-muted)" }}>
                        {formatDateArabic(date)}
                    </p>
                )}

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
                                        {formatTime12(slot.start)} - {formatTime12(slot.end)}
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

            {/* ملخص الحجز الكامل */}
            <section className="booking-card summary-card">
                <h2 className="section-title">ملخص الحجز</h2>

                <div className="summary-row">
                    <span>الملعب</span>
                    <strong>{venue.name}</strong>
                </div>

                {pitchBadge && (
                    <div className="summary-row">
                        <span>النوع</span>
                        <strong>{pitchBadge}</strong>
                    </div>
                )}

                <div className="summary-row">
                    <span>التاريخ</span>
                    <strong>{formatDateArabic(date)}</strong>
                </div>

                <div className="summary-row">
                    <span>الموعد</span>
                    <strong>
                        {!hasSelection ? (
                            "لم يتم اختيار أي ميعاد بعد"
                        ) : (
                            selectedSlots.map((slot) => (
                                <div key={`${slot.start}-${slot.end}`}>
                                    {formatTime12(slot.start)} - {formatTime12(slot.end)}
                                </div>
                            ))
                        )}
                    </strong>
                </div>

                {hasSelection && (
                    <div className="summary-row">
                        <span>إجمالي المدة</span>
                        <strong>{totalDurationText}</strong>
                    </div>
                )}

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

                {hasSelection && (
                    <div className="summary-remaining">
                        المتبقي للدفع في الملعب: <strong>{remainingAtVenue.toFixed(2)} جنيه</strong>
                    </div>
                )}

                <button
                    type="button"
                    className="confirm-booking-button"
                    onClick={() => handleBooking}
                    disabled={!hasSelection || isPaying}
                >
                    {isPaying ? "جاري التحويل..." : "ادفع العربون أونلاين"}
                </button>

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

                {/* ملاحظة: التواصل عبر المنصة فقط */}
                <p className="platform-only-notice">
                    <UserLock size={20} /> كل التواصل والحجز والإلغاء يتم من خلال المنصة فقط. لا يتم مشاركة أي بيانات تواصل شخصية بين اللاعبين وأصحاب الملاعب.
                </p>
            </section>
        </main>
    );
}
