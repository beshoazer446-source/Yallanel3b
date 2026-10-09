<div dir="rtl">

# يلا نلعب (Yallanel3b)

منصة مصرية لحجز الملاعب الرياضية، بتجمع بين اللاعبين وأصحاب الملاعب وبتلغي الاتصالات التقليدية ودفاتر الحجز اليدوية.

- **اللاعب:** يدور على ملعب، يشوف الساعات المتاحة، ويحجز ويدفع عربون 25%.
- **صاحب الملعب:** يضيف ملعبه ومواعيده، ويراجع الحجوزات ويؤكدها أو يرفضها، ويتابع إيراداته.
- **الأدمن:** يتابع المنصة كلها.

## التقنيات

| الجزء | التقنية |
|---|---|
| الواجهة | React + Vite |
| التنقل بين الصفحات | react-router-dom |
| الباك إند والداتابيز | Supabase (Auth + PostgreSQL + Storage) |
| الاستضافة | Vercel أو Netlify |

مفيش سيرفر باك إند بنكتبه بإيدينا، Supabase هو الباك إند.

## التشغيل لأول مرة

```bash
git clone https://github.com/beshoazer446-source/Yallanel3b.git
cd Yallanel3b
npm install
```

بعدها اعمل ملف اسمه `.env` (جنب `package.json`) وحط فيه:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

اطلب القيم من قائد الفريق في الخاص. **ملف `.env` ممنوع يترفع على GitHub** (متحمي في `.gitignore`)، ومفيش مفاتيح تتكتب هنا في الـ README.

وبعدين شغّل الموقع:

```bash
npm run dev
```

وافتح `http://localhost:5173`. ولو غيرت في `.env` لازم تقفل السيرفر (`Ctrl + C`) وتشغّله تاني.

### مشاكل شائعة على ويندوز

- **`running scripts is disabled` في PowerShell:** شغّل مرة واحدة `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` واكتب `Y`.
- **error فيه كلمة `rolldown` أو `native binding`:** امسح فولدر `node_modules` وملف `package-lock.json` وكرر `npm install`.
- **المشروع جوه فولدر OneDrive:** انقله بره (مثلاً `C:\Projects`)، لأن OneDrive بيبطّأ `npm install`.

## هيكل المشروع

```
src/
  components/    كومبوننتس مشتركة (Navbar, Button, ...)
  context/       AuthContext (المستخدم الحالي)
  data/          mockData.js (داتا وهمية للتطوير)
  lib/           supabaseClient.js
  services/      دوال جلب وحفظ الداتا (getVenues, getBookings, ...)
  pages/
    auth/        تسجيل الدخول والتسجيل
    owner/       تسجيل الأونر، إدارة الملعب، لوحة التحكم، الحجوزات
    booking/     الحجز والعربون
    venues/      الملاعب، البحث، التفاصيل، حسابي وحجوزاتي
  App.jsx        كل الـ routes
  index.css      الألوان والستايل العام
```

## الستايل والألوان

الألوان كلها متغيرات في `src/index.css`. **ممنوع تكتب لون من عندك**، استخدم المتغيرات:

| المتغير | الاستخدام |
|---|---|
| `var(--yellow)` | أصفر: الزراير الرئيسية والتمييز |
| `var(--green)` | أخضر غامق: العناوين |
| `var(--green-dark)` | أخضر داكن: الهيرو والسايد بار |
| `var(--bg)` | خلفية الصفحات |
| `var(--text)` / `var(--text-muted)` | النص الأساسي والرمادي |
| `var(--status-confirmed)` | حجز مؤكد |
| `var(--status-pending)` | حجز قيد المراجعة |
| `var(--status-cancelled)` | حجز ملغي |

وفيه كلاسات جاهزة: `.container` و`.btn` و`.btn-primary` و`.btn-outline` و`.card`.

الموقع كله عربي (RTL) بخط Cairo.

## الداتابيز

5 جداول، وأسماء الحقول في الكود لازم تطابقها بالظبط:

| الجدول | بيخزن إيه |
|---|---|
| `profiles` | الحسابات: `id`, `name`, `email`, `phone`, `role` |
| `venues` | الملاعب: السعر، العنوان، `deposit_percent`, `slot_minutes`, `amenities`... |
| `venue_images` | صور الملعب (`sort_order`) |
| `venue_working_hours` | فترات شغل الملعب: `day_of_week`, `open_time`, `close_time` |
| `bookings` | الحجوزات: `date`, `start_time`, `end_time`, `price`, `deposit_amount`, `status` |

### حاجات لازم تعرفها

- **أنواع الحساب (`role`):** `user` أو `owner` أو `admin`.
- **حالات الحجز (`status`):** `pending` ثم `confirmed`، أو `rejected` أو `cancelled`. مفيش حالات تانية.
- **الأوقات** نصوص بصيغة `"19:00"`.
- **`day_of_week`:** `0` للأحد وحتى `6` للسبت. اليوم اللي ملوش صف في `venue_working_hours` الملعب مقفول فيه.
- **الساعات المحجوزة** بتتحسب من جدول `bookings` نفسه، مفيش جدول للمواعيد.
- **منع الحجز المزدوج** الداتابيز بتعمله لوحدها.

### التعامل مع Supabase

- ما تقراش جدول `bookings` مباشرة عشان تعرف الساعات المحجوزة، استخدم الدالة دي:

```js
const { data: taken } = await supabase.rpc('get_taken_slots', {
  p_venue_id: venueId,
  p_date: '2026-10-12',
})
// [{ start_time: "19:00:00", end_time: "20:00:00" }, ...]
```

- عند إنشاء حجز **ما تبعتش `price` ولا `deposit_amount`**، بيتحسبوا في الداتابيز.
- ممنوع تعدّل في الجداول أو الصلاحيات من Supabase مباشرة، اطلب أي تعديل من قائد الفريق.

## إزاي نجلب الداتا (الدوال)

الصفحة **ما تقراش `mockData.js` مباشرة**. اكتب دالة في `src/services` والصفحة تنادي الدالة:

```js
// src/services/venuesService.js
import { venues } from '../data/mockData'

export async function getVenues() {
  return venues.filter((v) => v.is_active)
}
// لما نربط بـ Supabase بنبدّل جوه الدالة بس:
// const { data } = await supabase.from('venues').select('*')
```

كده الصفحة مش بتتغير لما نربط.

## قواعد الشغل

### Git
1. محدش يرفع على `main` مباشرة، كل واحد على branch بتاعه.
2. كل يوم قبل ما تبدأ:
   ```bash
   git checkout main
   git pull
   git checkout اسم-الـbranch-بتاعك
   git merge main --no-edit
   ```
3. لما تخلص جزء: `git push` وافتح Pull Request على `main`، وقائد الفريق بيراجع ويدمج.
4. في وصف الـ PR اكتب `Closes #رقم-الـIssue` عشان تتقفل لوحدها.
5. رسالة الـ commit واضحة بالإنجليزي (`add venue card component`)، مش `wip`.
6. `.env` و`node_modules` ممنوع يترفعوا أبداً.

### الفولدرات
7. كل واحد بيشتغل في فولدر صفحاته بس جوه `src/pages`.
8. الكومبوننتس المشتركة في `src/components`، واسأل في الجروب قبل ما تعمل واحدة جديدة.
9. `App.jsx`: عدّل سطر الـ route بتاعك بس (ده الملف اللي بيحصل فيه conflict).
10. ما تعدلش في ملف حد تاني غير بعد ما تقوله.
11. أسماء الكومبوننتس بحرف كبير (`VenueCard.jsx`)، والباقي عادي (`venuesService.js`).

### التنظيم
12. حرّك الكارت بتاعك في Project Board: Todo ← In Progress ← Done.
13. كل يوم رسالة قصيرة في الجروب: عملت إيه / هعمل إيه / عندي مشكلة إيه.
14. لو عندك مشكلة ابعت صورة الشاشة، مش "مش شغال".
15. لو جالك conflict في ملف مشترك ابعت صورته الأول قبل ما تحله.

## توزيع الشغل

| الشخص | المسؤولية |
|---|---|
| 1 | التسجيل والدخول + الداتابيز + الصلاحيات |
| 2 | تسجيل صاحب الملعب + إضافة وتعديل الملعب |
| 3 | نظام الحجز + العربون |
| 4 | لوحة تحكم الأونر + إدارة الحجوزات |
| 5 | عرض الملاعب + البحث + التفاصيل + حسابي وحجوزاتي |

</div>