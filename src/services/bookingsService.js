// src/services/bookingsService.js
import { bookings } from '../data/mockData';

// جلب حجوزات المستخدم (يمكن لاحقاً تمرير معرف المستخدم عند ربط Supabase)
export async function getUserBookings() {
  // ملاحظة: لاحقاً عند ربط Supabase، سيتم جلب الحجوزات الخاصة بالمستخدم المسجل الدخول حالياً
  return bookings || [];
}
```[cite: 7]

---

### الخطوة 2: إنشاء صفحة الحجوزات (`src/pages/venues/MyBookingsPage.jsx`)

1. اذهب إلى مجلد `src/pages/venues/` وأنشئ ملفاً جديداً باسم **`MyBookingsPage.jsx`**.
2. ضع بداخله الكود التالي الذي يعرض الحجوزات ويلون حالاتها بناءً على المتغيرات الجاهزة في النظام:

```jsx
// src/pages/venues/MyBookingsPage.jsx
import React, { useState, useEffect } from 'react';
import { getUserBookings } from '../../services/bookingsService';

export default function MyBookingsPage() {
  const [userBookings, setUserBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      const data = await getUserBookings();
      setUserBookings(data);
      setLoading(false);
    }
    fetchBookings();
  }, []);

  // دالة لتحديد لون حالة الحجز بناءً على المتغيرات المعتمدة في المشروع
  const getStatusStyle = (status) => {
    switch (status) {
      case 'confirmed':
        return { color: 'var(--status-confirmed)', fontWeight: 'bold' };
      case 'pending':
        return { color: 'var(--status-pending)', fontWeight: 'bold' };
      case 'cancelled':
      case 'rejected':
        return { color: 'var(--status-cancelled)', fontWeight: 'bold' };
      default:
        return { color: 'var(--text-muted)' };
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: '20px' }}>جاري تحميل حجوزاتك...</div>;
  }

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <h2>حجوزاتي وحسابي</h2>
      
      {userBookings.length === 0 ? (
        <p style={{ marginTop: '20px' }}>ليس لديك أي حجوزات حتى الآن.</p>
      ) : (
        <div style={{ display: 'grid', gap: '16px', marginTop: '20px' }}>
          {userBookings.map((booking) => (
            <div key={booking.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>حجز رقم: #{booking.id}</h3>
                <span style={getStatusStyle(booking.status)}>
                  الحالة: {booking.status}
                </span>
              </div>
              
              <div style={{ margin: '12px 0', color: 'var(--text-muted)' }}>
                <p><strong>التاريخ:</strong> {booking.date}</p>
                <p><strong>الوقت:</strong> من {booking.start_time} إلى {booking.end_time}</p>
                <p><strong>السعر الإجمالي:</strong> {booking.price} ج.م</p>
                <p><strong>العربون المطلوب (25%):</strong> {booking.deposit_amount} ج.م</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```[cite: 7]

---

### الخطوة 3: إضافة المسار في `App.jsx`
لا تنسَ إضافة المسار الخاص بصفحة الحجوزات في ملف `App.jsx` في السطر المخصص لك فقط لتجنب أي تضارب (Conflicts) مع زملائك[cite: 7]:
```jsx
<Route path="/my-bookings" element={<MyBookingsPage />} />
``[cite: 7]

<ElicitationsGroup>
  <Elicitation context="Concluding the core task implementation">
    <Question>بهذا نكون أنجزت كامل مهامك (عرض الملاعب، البحث، التفاصيل، وحسابي وحجوزاتي). هل تحتاج إلى مساعدة في مراجعة الكود أو ربطه بالـ Git والـ Pull Request؟</Question>
    <Options>
      <Option label="نعم، اشرح لي كيف أرفع الكود على الـ Git وأفتح Pull Request" value="git_guide"/>
      <Option label="لا، كل شيء واضح وجاهز للرفع" value="all_done"/>
    </Options>
  </ElicitationsGroup>
</ElicitationsGroup>