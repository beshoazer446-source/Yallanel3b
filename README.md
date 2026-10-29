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
VITE_SUPABASE_PAYMENT_PROOFS_BUCKET=payment-proofs
```

اطلب القيم من قائد الفريق. من لوحة مشروع Supabase افتح **Storage → Buckets → New bucket**، واكتب الاسم `payment-proofs` وأوقف خيار **Public bucket** ليظل خاصًا. إذا كان عندكم bucket آخر، ضع اسمه في `VITE_SUPABASE_PAYMENT_PROOFS_BUCKET`. يلزم أيضًا إعداد سياسات Storage للسماح بالرفع والعرض المصرح به؛ إنشاء bucket وحده لا يفتح الصلاحيات. **ملف `.env` ممنوع يترفع على GitHub** (متحمي في `.gitignore`)، ومفيش مفاتيح تتكتب هنا في الـ README.

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

6 جداول، وأسماء الحقول في الكود لازم تطابقها بالظبط:

| الجدول | بيخزن إيه |
|---|---|
| `profiles` | الحسابات: `id`, `name`, `email`, `phone`, `role` |
| `venues` | الملاعب: السعر، العنوان، `slot_minutes`, `amenities`... |
| `venue_images` | صور الملعب (`sort_order`) |
| `venue_working_hours` | فترات شغل الملعب: `day_of_week`, `open_time`, `close_time` |
| `venue_payment_methods` | طرق الدفع المتاحة عند الملعب (`method`, `account`)، والأونر هو اللي بيحددها |
| `bookings` | الحجوزات: `date`, `start_time`, `end_time`, `price`, `deposit_amount`, `status`, `payment_proof_url` |

### حاجات لازم تعرفها

- **أنواع الحساب (`role`):** `user` أو `owner` أو `admin`.
- **حالات الحجز (`status`):** `pending` ثم `confirmed`، أو `rejected` أو `cancelled`. مفيش حالات تانية.
- **الأوقات** نصوص بصيغة `"19:00"`.
- **`day_of_week`:** `0` للأحد وحتى `6` للسبت. اليوم اللي ملوش صف في `venue_working_hours` الملعب مقفول فيه.
- **الساعات المحجوزة** بتتحسب من جدول `bookings` نفسه، مفيش جدول للمواعيد.
- **منع الحجز المزدوج** الداتابيز بتعمله لوحدها.
- **العربون ثابت 25%** لكل الملاعب: `DEPOSIT_PERCENT` في `src/lib/constants.js` (مش عمود في الداتابيز).
- **طرق الدفع:** كل ملعب عنده صف أو أكتر في `venue_payment_methods`، والأونر هو اللي يحدد. أسماء الطرق بالعربي في `PAYMENT_METHODS` في `src/lib/constants.js`. المنصة مبتعالجش الدفع، اللاعب بيحوّل بإيده ويرفع صورة التحويل.

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
- حجز اللاعب يرفع إثبات التحويل (JPG/PNG/WebP/PDF، حتى 5MB) إلى الـ bucket المحدد في `VITE_SUPABASE_PAYMENT_PROOFS_BUCKET` (الافتراضي `payment-proofs`)، ويحفظ مساره في `payment_proof_url`. يلزم أن تكون سياسات Storage تسمح للمستخدم المسجل برفع ملفه وأن تسمح لصاحب الملعب بإنشاء رابط مؤقت لعرض الإثبات.
- كل جداول التطبيق وStorage لازم تكون مجهزة بصلاحيات RLS المناسبة للأدوار؛ واجهة React لا تعتبر بديلًا عن صلاحيات قاعدة البيانات.
- التسجيل العام ينشئ حساب لاعب، وصفحة `/register-owner` تنشئ حساب أونر. يجب أن ينسخ trigger إنشاء `profiles` قيمة `role` إلى الدور `user` أو `owner`، مع عدم قبول `admin` من بيانات التسجيل أبدًا. إذا ظل الحساب بدور لاعب بعد التسجيل، فإعداد trigger في Supabase يحتاج مراجعة.
- عمولة المنصة المحسوبة 10% من إجمالي الحجوزات المؤكدة، وتظهر كمستحق يدوي من الأونر؛ التحويل البنكي المباشر لا يقتطعها تلقائيًا. التحصيل/التقسيم التلقائي يتطلب بوابة دفع وخلفية موثوقة تدعم split payments.

## جلب وحفظ الداتا

الصفحات لا تقرأ `mockData.js` مباشرة. خدمات `src/services` تتصل بـ Supabase، والصفحات تناديها بدل تنفيذ الاستعلامات بنفسها. بيانات `mockData.js` محفوظة كمرجع للتطوير فقط.

```js
// src/services/venuesService.js
const { data, error } = await supabase
  .from('venues')
  .select('*')
  .eq('is_active', true)
if (error) throw error
```

تدفق التطبيق الحالي: تسجيل/دخول اللاعب أو صاحب الملعب، عرض وبحث الملاعب، التفاصيل ومواعيد العمل وطرق الدفع، إنشاء الحجز وإثبات التحويل، حجوزات اللاعب، إدارة ملاعب وحجوزات الأونر، ولوحة الأدمن.

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