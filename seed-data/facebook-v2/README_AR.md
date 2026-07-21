# حزمة بيانات فيسبوك المهيأة للـ seed — الإصدار 2

هذه الحزمة ناتجة عن مراجعة **69 صورة أصلية** رفعها فريق التطوير من صفحة الجمعية الدولية للشعراء العرب.

## ما تم إنجازه

- إعادة تسمية كل صورة باسم مفهوم وثابت.
- ربط كل صورة بفعالية أو شخص أو نوع محتوى.
- الاحتفاظ باسم الملف الأصلي ورابط صفحة الصورة على فيسبوك.
- إنشاء **36 صورة شخصية مربعة** مشتقة من بطاقات المشاركين، مع الاحتفاظ بالبطاقات الكاملة.
- إنشاء ملفات JSON مترابطة يمكن استخدامها كمصدر بيانات واحد للـseed.
- فصل العناصر الجاهزة عن العناصر التي تحتاج مراجعة.
- إنشاء contact sheets لتصفح الصور سريعًا.

## ملخص المحتوى

- الصور الأصلية: 69
- سجلات الوسائط الإجمالية، مع الصور المشتقة: 105
- الأشخاص في ملف `people.json`: 69
- الأشخاص الجاهزون مبدئيًا للـseed: 41
- الأشخاص الذين يحتاجون تأكيد الدولة: 8
- الأشخاص الذين لديهم صورة شخصية محلية: 36
- الفعاليات في `events.json`: 6
- عناصر قائمة المراجعة: 12

## الفعاليات التي تم ربط الصور بها

1. مهرجان الشعر العربي في إسطنبول — الدورة السادسة، 22–23 يونيو 2024.
2. مهرجان ربيع القوافي — الدورة الرابعة، 2–3 مارس 2024.
3. مهرجان ربيع القوافي — الدورة الخامسة، 19 أبريل 2025.
4. مهرجان الشعر العربي في إسطنبول — الدورة السابعة، 21–23 يونيو 2025.
5. ملتقى القصيدة العربية في إسطنبول — الدورة الأولى، أغسطس 2026.

بقي سجل الدورة الثامنة 2026 من الحزمة السابقة، لكنه لا يملك صورًا ضمن الملفات التي رفعتها في هذه الدفعة.

## بنية الحزمة

```text
data/
  events.json
  people.json
  media-manifest.json
  source-image-map.json
  source-image-map.tsv
  review-queue.json
  taxonomies.json
  site-settings.json
  literary-works.json
  source-index.json
  import-order.json

images/
  events/<event-slug>/
  people/profiles/
  branding/
  review/

catalog/
  <event-slug>-contact-sheet.jpg
  profile-crops-contact-sheet.jpg

scripts/
  validate.mjs
  copy-assets-to-public.mjs
  SEED_INTEGRATION_AR.md
```

## الملفات الأساسية

### `data/source-image-map.json`

الخريطة الكاملة من الاسم الأصلي إلى الاسم الجديد، وتشمل:

- `originalFilename`
- `renamedFilename`
- `filePath`
- `eventSlug`
- `personSlug`
- `assetType`
- `seedUsage`
- `sourceUrl`
- `sha256`

### `data/media-manifest.json`

سجل كل صورة سيتم رفعها إلى Payload Media.

الصور الشخصية المشتقة تحمل:

```json
{
  "assetType": "profile-crop",
  "derivedFromAssetKey": "..."
}
```

وبذلك يمكن الرجوع دائمًا إلى البطاقة الرسمية الكاملة.

### `data/people.json`

الحقلان المهمان:

```json
{
  "profileImageKey": "person-profile-mustafa-matar",
  "profileCardImageKey": "arab-poetry-festival-7-organizer-mustafa-matar"
}
```

- `profileImageKey`: الصورة المربعة المناسبة لبطاقة الشخص وصفحته.
- `profileCardImageKey`: البطاقة الأصلية المنشورة على فيسبوك.

### `data/events.json`

كل فعالية مرتبطة بواسطة مفاتيح الوسائط:

```json
{
  "posterImageKey": "...",
  "coverImageKey": "...",
  "socialImageKey": "...",
  "galleryImageKeys": ["..."]
}
```

البرنامج المتاح في الصور تم تفريغه إلى `programDays`.

## ترتيب الاستيراد

1. `taxonomies.json`
2. رفع ملفات `media-manifest.json` وربط `key -> media ID`
3. `people.json`
4. `events.json`
5. `literary-works.json`
6. `site-settings.json`

## النسخ إلى المشروع

من داخل الحزمة:

```bash
node scripts/copy-assets-to-public.mjs /path/to/arab-poets-platform
```

سيتم نسخ الصور إلى:

```text
public/images/facebook-seed/
```

السكربت لا يعدل `scripts/seed.ts` تلقائيًا، حتى لا يكسر منطق الـseed الحالي.

## التحقق

```bash
node scripts/validate.mjs
```

يتحقق من:

- وجود كل الملفات.
- عدم تكرار المفاتيح والـslugs.
- صحة العلاقات بين الأشخاص والفعاليات.
- وجود الدول المستخدمة.
- وجود مفاتيح الصور المشار إليها.

## عناصر تحتاج مراجعة قبل النشر النهائي

راجع `data/review-queue.json`.

أهمها:

- عدد قليل من بطاقات 2024 لا يذكر الدولة، بينما حقل الدولة إلزامي في `People`.
- كتابة اسم قاعة فعالية ربيع القوافي الخامسة تحتاج مراجعة نهائية.
- ملتقى أغسطس 2026 معلن من 5 إلى 10 أغسطس، لكن إحدى الصور تسميه برنامجًا من خمسة أيام.
- صورة أرشيفية واحدة من عام 2021 لم يمكن ربطها بفعالية محددة.
- منشور تهنئة عيد الأضحى محفوظ للأرشيف، لكنه مستبعد من صور الكيانات الأساسية.

## ملاحظة مهمة حول الصور الشخصية

لم يتم التعرف على الأشخاص من الوجوه. الربط تم اعتمادًا على **الاسم المطبوع داخل البطاقة الرسمية نفسها**. الصور المربعة هي قص آلي من البطاقة، ولذلك يفضل استبدالها مستقبلًا بصورة شخصية أصلية عندما يرسلها العميل.
