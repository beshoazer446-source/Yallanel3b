import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useTheme } from "../../context/useTheme";
import { getOwnerBookings } from "../../services/bookingsService";
import "./OwnerCustomersPage.css";

function formatCurrency(amount) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) return "0 ج.م";
  return `${numeric.toLocaleString("ar-EG")} ج.م`;
}

function formatBookingDate(dateStr, startTime) {
  if (!dateStr) return "غير محدد";
  const timePart = startTime ? ` • ${String(startTime).slice(0, 5)}` : "";
  return `${dateStr}${timePart}`;
}

function getCustomerPhone(booking) {
  return (
    booking?.player?.phone ||
    booking?.customer_phone ||
    booking?.phone ||
    booking?.user_phone ||
    ""
  );
}

function getCustomerName(booking, fallbackId) {
  return (
    booking?.player?.name ||
    booking?.player?.full_name ||
    booking?.customer_name ||
    booking?.full_name ||
    booking?.name ||
    (fallbackId ? `لاعب (${String(fallbackId).slice(0, 6)})` : "عميل")
  );
}

function buildCustomersSummary(bookings) {
  const map = new Map();

  for (const booking of bookings) {
    const rawKey =
      booking?.user_id ||
      getCustomerPhone(booking) ||
      getCustomerName(booking, "") ||
      `booking-${booking.id}`;
    const key = String(rawKey);

    const price = Number(booking?.price ?? booking?.total_price ?? 0);
    const validPrice = Number.isFinite(price) ? price : 0;
    const isConfirmed = booking?.status === "confirmed";
    const isCancelled =
      booking?.status === "cancelled" || booking?.status === "rejected";

    const current = map.get(key) || {
      id: key,
      name: getCustomerName(booking, booking?.user_id),
      phone: getCustomerPhone(booking),
      bookingsCount: 0,
      confirmedCount: 0,
      totalSpent: 0,
      lastBookingDate: booking?.date || "",
      lastBookingTime: booking?.start_time || "",
      lastVenueName: booking?.venue?.name || "ملعب غير محدد",
      venuesSet: new Set(),
    };

    const resolvedName = getCustomerName(booking, booking?.user_id);
    if (resolvedName && !resolvedName.startsWith("لاعب (")) {
      current.name = resolvedName;
    }

    const resolvedPhone = getCustomerPhone(booking);
    if (resolvedPhone && !current.phone) {
      current.phone = resolvedPhone;
    }

    current.bookingsCount += 1;
    if (isConfirmed) {
      current.confirmedCount += 1;
    }
    if (!isCancelled) {
      current.totalSpent += validPrice;
    }

    if (booking?.venue?.name) {
      current.venuesSet.add(booking.venue.name);
    }

    const candidateStamp = `${booking?.date || ""}T${booking?.start_time || "00:00"}`;
    const currentStamp = `${current.lastBookingDate || ""}T${current.lastBookingTime || "00:00"}`;
    if (candidateStamp >= currentStamp) {
      current.lastBookingDate = booking?.date || current.lastBookingDate;
      current.lastBookingTime = booking?.start_time || current.lastBookingTime;
      current.lastVenueName = booking?.venue?.name || current.lastVenueName;
    }

    map.set(key, current);
  }

  return Array.from(map.values())
    .map((item) => ({
      ...item,
      venuesList: Array.from(item.venuesSet),
    }))
    .sort((a, b) => {
      if (b.bookingsCount !== a.bookingsCount) {
        return b.bookingsCount - a.bookingsCount;
      }
      return b.totalSpent - a.totalSpent;
    });
}

export default function OwnerCustomersPage() {
  const auth = useAuth();
  const user = auth?.user ?? null;
  const authLoading = auth?.loading ?? false;

  const { theme } = useTheme();
  const activeTheme =
    theme === "dark" || theme === "light"
      ? theme
      : document.documentElement.dataset.theme === "dark"
        ? "dark"
        : "light";

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // all | repeat | confirmed

  useEffect(() => {
    let isMounted = true;

    async function loadOwnerCustomers() {
      if (authLoading) return;

      if (!user?.id) {
        if (isMounted) {
          setErrorMsg("يرجى تسجيل الدخول كصاحب ملعب لعرض بيانات العملاء.");
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setErrorMsg("");

      try {
        const ownerBookings = await getOwnerBookings(user.id);

        if (!isMounted) return;
        setBookings(ownerBookings ?? []);
      } catch (err) {
        if (!isMounted) return;
        setErrorMsg(err?.message || "تعذر تحميل بيانات العملاء حالياً.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadOwnerCustomers();
    return () => {
      isMounted = false;
    };
  }, [user?.id, authLoading]);

  const venuesCount = useMemo(() => {
    const uniqueVenues = new Set();
    for (const booking of bookings) {
      const venueKey = booking?.venue?.id || booking?.venue_id || booking?.venue?.name;
      if (venueKey) {
        uniqueVenues.add(String(venueKey));
      }
    }
    return uniqueVenues.size;
  }, [bookings]);

  const customers = useMemo(() => buildCustomersSummary(bookings), [bookings]);

  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const repeatCustomers = customers.filter((c) => c.bookingsCount > 1).length;
    const totalBookingsCount = bookings.length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);

    return {
      totalCustomers,
      repeatCustomers,
      totalBookingsCount,
      totalRevenue,
    };
  }, [customers, bookings]);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return customers.filter((customer) => {
      if (filterType === "repeat" && customer.bookingsCount <= 1) {
        return false;
      }
      if (filterType === "confirmed" && customer.confirmedCount === 0) {
        return false;
      }

      if (!q) return true;

      const matchesName = customer.name.toLowerCase().includes(q);
      const matchesPhone = customer.phone.toLowerCase().includes(q);
      const matchesVenue = customer.venuesList.some((v) =>
        v.toLowerCase().includes(q),
      );
      return matchesName || matchesPhone || matchesVenue;
    });
  }, [customers, searchQuery, filterType]);

  return (
    <section
      className="yn-customers-page"
      data-theme={activeTheme}
      dir="rtl"
    >
      <div className="yn-customers-container">
        <header className="yn-customers-header">
          <div className="yn-customers-heading">
            <div className="yn-customers-mark" aria-hidden="true">
              ع
            </div>
            <div>
              <h1>العملاء</h1>
              <p>
                متابعة العملاء الذين حجزوا في ملاعبك ({venuesCount} ملعب مسجل)،
                ومراجعة عدد الحجوزات وبيانات التواصل.
              </p>
            </div>
          </div>

          <div className="yn-customers-actions">
            <Link to="/owner/bookings" className="yn-customers-btn secondary">
              إدارة الحجوزات
            </Link>
            <Link to="/owner/dashboard" className="yn-customers-btn">
              لوحة التحكم
            </Link>
          </div>
        </header>

        {errorMsg && (
          <div className="yn-customers-alert error" role="alert">
            {errorMsg}
          </div>
        )}

        <div className="yn-customers-stats">
          <div className="yn-customers-stat">
            <p>إجمالي العملاء</p>
            <h2>{loading ? "..." : stats.totalCustomers}</h2>
            <small>عملاء مرتبطون بحجوزات ملاعبك</small>
          </div>

          <div className="yn-customers-stat">
            <p>عملاء متكررون</p>
            <h2>{loading ? "..." : stats.repeatCustomers}</h2>
            <small>أكثر من حجز واحد على المنصة</small>
          </div>

          <div className="yn-customers-stat">
            <p>إجمالي الحجوزات</p>
            <h2>{loading ? "..." : stats.totalBookingsCount}</h2>
            <small>حجوزات مسجلة على ملاعبك</small>
          </div>

          <div className="yn-customers-stat">
            <p>إجمالي قيمة الحجوزات</p>
            <h2>{loading ? "..." : formatCurrency(stats.totalRevenue)}</h2>
            <small>باستثناء الحجوزات الملغاة أو المرفوضة</small>
          </div>
        </div>

        <div className="yn-customers-panel">
          <div className="yn-customers-toolbar">
            <div className="yn-customers-filters">
              <button
                type="button"
                className={`yn-filter-chip ${filterType === "all" ? "active" : ""}`}
                onClick={() => setFilterType("all")}
              >
                الكل ({customers.length})
              </button>
              <button
                type="button"
                className={`yn-filter-chip ${filterType === "repeat" ? "active" : ""}`}
                onClick={() => setFilterType("repeat")}
              >
                متكررون ({stats.repeatCustomers})
              </button>
              <button
                type="button"
                className={`yn-filter-chip ${filterType === "confirmed" ? "active" : ""}`}
                onClick={() => setFilterType("confirmed")}
              >
                لديهم حجوزات مؤكدة
              </button>
            </div>

            <div className="yn-customers-search-box">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم العميل أو رقم الهاتف أو اسم الملعب..."
                className="yn-customers-search-input"
                aria-label="بحث عن عميل"
              />
            </div>
          </div>

          {loading ? (
            <div className="yn-customers-empty">جاري تحميل بيانات العملاء...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="yn-customers-empty">
              {customers.length === 0
                ? "لا يوجد عملاء مسجلون على ملاعبك حتى الآن."
                : "لا توجد نتائج مطابقة للبحث أو الفلتر الحالي."}
            </div>
          ) : (
            <div className="yn-customers-table-wrap">
              <table className="yn-customers-table">
                <thead>
                  <tr>
                    <th>العميل</th>
                    <th>رقم الهاتف</th>
                    <th>عدد الحجوزات</th>
                    <th>الملاعب</th>
                    <th>آخر حجز</th>
                    <th>إجمالي المبالغ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <div className="yn-customer-name-cell">
                          <span className="yn-customer-avatar" aria-hidden="true">
                            {customer.name.trim().slice(0, 1) || "ع"}
                          </span>
                          <div>
                            <div className="yn-customer-name">{customer.name}</div>
                            {customer.bookingsCount > 1 && (
                              <span className="yn-repeat-tag">عميل متكرر</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td dir="ltr" className="yn-customer-phone">
                        {customer.phone || "غير متوفر"}
                      </td>
                      <td>
                        <span className="yn-bookings-count-pill">
                          {customer.bookingsCount} حجز
                        </span>
                      </td>
                      <td>
                        {customer.venuesList.length > 0
                          ? customer.venuesList.join("، ")
                          : customer.lastVenueName}
                      </td>
                      <td>
                        {formatBookingDate(
                          customer.lastBookingDate,
                          customer.lastBookingTime,
                        )}
                      </td>
                      <td className="yn-customer-amount">
                        {formatCurrency(customer.totalSpent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}