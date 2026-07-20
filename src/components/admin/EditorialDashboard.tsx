import Link from "next/link";
import type { WidgetServerProps } from "payload";

const quickActions = [
  { href: "/admin/collections/events/create", ar: "إضافة فعالية", en: "Add event" },
  { href: "/admin/collections/people/create", ar: "إضافة شخص", en: "Add person" },
  { href: "/admin/collections/media/create", ar: "رفع وسائط", en: "Upload media" },
  { href: "/admin/collections/participation-requests", ar: "طلبات المشاركة", en: "Participation requests" },
  { href: "/admin/collections/contact-messages", ar: "رسائل التواصل", en: "Contact messages" },
];

export default async function EditorialDashboard({ req, locale }: WidgetServerProps) {
  const now = new Date().toISOString();
  const [
    upcoming,
    draftEvents,
    newParticipation,
    newContact,
    peopleWithoutImages,
    eventsWithoutCovers,
    latestEvents,
    latestPeople,
  ] = await Promise.all([
    req.payload.count({ collection: "events", where: { startDateTime: { greater_than_equal: now } }, overrideAccess: true }),
    req.payload.count({ collection: "events", where: { _status: { equals: "draft" } }, overrideAccess: true }),
    req.payload.count({ collection: "participation-requests", where: { status: { equals: "new" } }, overrideAccess: true }),
    req.payload.count({ collection: "contact-messages", where: { status: { equals: "new" } }, overrideAccess: true }),
    req.payload.count({ collection: "people", where: { profileImage: { exists: false } }, overrideAccess: true }),
    req.payload.count({ collection: "events", where: { coverImage: { exists: false } }, overrideAccess: true }),
    req.payload.find({ collection: "events", limit: 5, sort: "-updatedAt", depth: 0, overrideAccess: true }),
    req.payload.find({ collection: "people", limit: 5, sort: "-updatedAt", depth: 0, overrideAccess: true }),
  ]);
  const ar = locale?.code === "ar";
  const metrics = [
    { value: upcoming.totalDocs, label: ar ? "فعاليات قادمة" : "Upcoming events", href: "/admin/collections/events" },
    { value: draftEvents.totalDocs, label: ar ? "مسودات فعاليات" : "Event drafts", href: "/admin/collections/events?where[_status][equals]=draft" },
    { value: newParticipation.totalDocs, label: ar ? "طلبات جديدة" : "New requests", href: "/admin/collections/participation-requests" },
    { value: newContact.totalDocs, label: ar ? "رسائل جديدة" : "New messages", href: "/admin/collections/contact-messages" },
    { value: peopleWithoutImages.totalDocs + eventsWithoutCovers.totalDocs, label: ar ? "محتوى يحتاج صورًا" : "Content missing images", href: "/admin/collections/media" },
  ];
  const recentGroups = [
    {
      title: ar ? "آخر الفعاليات المعدلة" : "Recently updated events",
      empty: ar ? "لا توجد فعاليات بعد." : "No events yet.",
      items: latestEvents.docs.map((doc) => ({ id: doc.id, title: String(doc.title || (ar ? "فعالية بلا عنوان" : "Untitled event")), href: `/admin/collections/events/${doc.id}`, status: doc._status })),
    },
    {
      title: ar ? "آخر ملفات الأشخاص" : "Recently updated people",
      empty: ar ? "لا توجد ملفات بعد." : "No profiles yet.",
      items: latestPeople.docs.map((doc) => ({ id: doc.id, title: String(doc.name || (ar ? "ملف بلا اسم" : "Unnamed profile")), href: `/admin/collections/people/${doc.id}`, status: doc._status })),
    },
  ];

  return (
    <section className="editorial-dashboard">
      <div className="editorial-dashboard__intro">
        <div>
          <span>{ar ? "مركز العمل التحريري" : "Editorial workspace"}</span>
          <h1>{ar ? "مرحبًا بك في إدارة منصة الشعراء" : "Welcome to the Arab Poets workspace"}</h1>
          <p>{ar ? "ابدأ بالمهمة المطلوبة بدل التنقل بين جميع جداول النظام." : "Start with the task you need instead of navigating every data collection."}</p>
        </div>
        <a className="editorial-dashboard__site-link" href="/ar" target="_blank" rel="noreferrer">{ar ? "فتح الموقع" : "Open website"} ↗</a>
      </div>
      <div className="editorial-dashboard__actions">
        {quickActions.map((action) => <Link href={action.href} key={action.href}>{ar ? action.ar : action.en}<span>+</span></Link>)}
      </div>
      <div className="editorial-dashboard__metrics">
        {metrics.map((metric) => <Link href={metric.href} key={metric.label}><strong>{metric.value}</strong><span>{metric.label}</span></Link>)}
      </div>
      <div className="editorial-dashboard__workspace">
        {recentGroups.map((group) => (
          <section className="editorial-dashboard__recent" key={group.title}>
            <h2>{group.title}</h2>
            {group.items.length ? (
              <div>
                {group.items.map((item) => (
                  <Link href={item.href} key={item.id}>
                    <span>{item.title}</span>
                    <small className={item.status === "published" ? "is-published" : "is-draft"}>
                      {item.status === "published" ? (ar ? "منشور" : "Published") : (ar ? "مسودة" : "Draft")}
                    </small>
                  </Link>
                ))}
              </div>
            ) : <p>{group.empty}</p>}
          </section>
        ))}
        <aside className="editorial-dashboard__attention">
          <h2>{ar ? "يحتاج إلى انتباه" : "Needs attention"}</h2>
          <Link href="/admin/collections/events"><strong>{eventsWithoutCovers.totalDocs}</strong><span>{ar ? "فعاليات بلا صورة غلاف" : "Events without cover images"}</span></Link>
          <Link href="/admin/collections/people"><strong>{peopleWithoutImages.totalDocs}</strong><span>{ar ? "ملفات أشخاص بلا صورة" : "Profiles without images"}</span></Link>
          <Link href="/admin/collections/participation-requests"><strong>{newParticipation.totalDocs}</strong><span>{ar ? "طلبات تنتظر المراجعة" : "Requests awaiting review"}</span></Link>
        </aside>
      </div>
      <div className="editorial-dashboard__help">
        <strong>{ar ? "ترتيب العمل المقترح" : "Suggested workflow"}</strong>
        <p>{ar ? "أنشئ المحتوى ← أضف الترجمة والصورة ← راجع المعاينة ← انشر." : "Create content → add translation and media → review the preview → publish."}</p>
      </div>
    </section>
  );
}
