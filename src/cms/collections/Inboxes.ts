import type { CollectionConfig, Field } from "payload";
import { adminOnly, adminOrEditor, fieldAdminOrEditor } from "../access";
import { adminGroups, bilingual, collectionLabels, option } from "../i18n";
import { validateOptionalURL } from "../validators";

const consentField: Field = {
  name: "consent",
  label: bilingual("الموافقة", "Consent"),
  type: "checkbox",
  required: true,
  validate: (value) =>
    value === true ? true : "الموافقة مطلوبة / Consent is required.",
};

const workflowFields = (contact: boolean): Field[] => [
  {
    name: "status",
    label: bilingual("الحالة", "Status"),
    type: "select",
    required: true,
    defaultValue: "new",
    options: contact
      ? [
          option("new", "جديدة", "New"),
          option("read", "مقروءة", "Read"),
          option("contacted", "تم التواصل", "Contacted"),
          option("closed", "مغلقة", "Closed"),
          option("spam", "مزعجة", "Spam"),
        ]
      : [
          option("new", "جديد", "New"),
          option("reviewed", "تمت المراجعة", "Reviewed"),
          option("contacted", "تم التواصل", "Contacted"),
          option("closed", "مغلق", "Closed"),
          option("spam", "مزعج", "Spam"),
        ],
    access: { create: () => false, update: fieldAdminOrEditor },
  },
  {
    name: "internalNotes",
    label: bilingual("ملاحظات داخلية", "Internal notes"),
    type: "textarea",
    access: { create: () => false, read: fieldAdminOrEditor, update: fieldAdminOrEditor },
  },
  {
    name: "submittedAt",
    label: bilingual("وقت الإرسال", "Submitted at"),
    type: "date",
    defaultValue: () => new Date().toISOString(),
    access: { create: () => false, update: () => false },
  },
];

export const ParticipationRequests: CollectionConfig = {
  slug: "participation-requests",
  labels: collectionLabels("طلب مشاركة", "طلبات المشاركة", "Participation request", "Participation requests"),
  admin: { useAsTitle: "fullName", group: adminGroups.inboxes },
  access: { create: adminOrEditor, read: adminOrEditor, update: adminOrEditor, delete: adminOnly },
  fields: [
    { name: "fullName", label: bilingual("الاسم الكامل", "Full name"), type: "text", required: true, minLength: 2, maxLength: 120 },
    { name: "country", label: bilingual("الدولة", "Country"), type: "text", required: true },
    { name: "city", label: bilingual("المدينة", "City"), type: "text" },
    { name: "email", label: bilingual("البريد الإلكتروني", "Email"), type: "email", required: true },
    { name: "whatsapp", label: bilingual("واتساب", "WhatsApp"), type: "text", required: true, minLength: 6, maxLength: 25 },
    { name: "shortBio", label: bilingual("نبذة قصيرة", "Short bio"), type: "textarea", maxLength: 1200 },
    {
      name: "participationType",
      label: bilingual("نوع المشاركة", "Participation type"),
      type: "select",
      required: true,
      options: [
        option("poet", "شاعر", "Poet"),
        option("writer", "كاتب", "Writer"),
        option("artist", "فنان", "Artist"),
        option("media", "إعلام", "Media"),
        option("other", "أخرى", "Other"),
      ],
    },
    { name: "requestedEvent", label: bilingual("الفعالية المطلوبة", "Requested event"), type: "relationship", relationTo: "events" },
    { name: "externalUrl", label: bilingual("رابط أعمال", "Portfolio URL"), type: "text", validate: validateOptionalURL },
    { name: "message", label: bilingual("الرسالة", "Message"), type: "textarea", maxLength: 3000 },
    consentField,
    ...workflowFields(false),
  ],
};

export const ContactMessages: CollectionConfig = {
  slug: "contact-messages",
  labels: collectionLabels("رسالة تواصل", "رسائل التواصل", "Contact message", "Contact messages"),
  admin: { useAsTitle: "subject", group: adminGroups.inboxes },
  access: { create: adminOrEditor, read: adminOrEditor, update: adminOrEditor, delete: adminOnly },
  fields: [
    { name: "name", label: bilingual("الاسم", "Name"), type: "text", required: true, minLength: 2, maxLength: 120 },
    { name: "email", label: bilingual("البريد الإلكتروني", "Email"), type: "email", required: true },
    { name: "phoneOrWhatsapp", label: bilingual("الهاتف أو واتساب", "Phone or WhatsApp"), type: "text" },
    { name: "subject", label: bilingual("الموضوع", "Subject"), type: "text", maxLength: 180 },
    { name: "message", label: bilingual("الرسالة", "Message"), type: "textarea", required: true, minLength: 10, maxLength: 5000 },
    consentField,
    ...workflowFields(true),
  ],
};
