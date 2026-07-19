"use client";

import { FormEvent, useState } from "react";
import type { Locale } from "@/i18n/config";

export function DemoForm({ locale, type }: { locale: Locale; type: "contact" | "participation" }) {
  const [submitted, setSubmitted] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSubmitted(true); }
  const participation = type === "participation";
  return <form className="form-card card" onSubmit={submit}>
    <div className="form-grid">
      <label><span>{locale === "ar" ? "الاسم الكامل *" : "Full name *"}</span><input required /></label>
      <label><span>{locale === "ar" ? "البريد الإلكتروني *" : "Email *"}</span><input type="email" required /></label>
      {participation ? <><label><span>{locale === "ar" ? "الدولة *" : "Country *"}</span><input required /></label><label><span>WhatsApp *</span><input required /></label><label><span>{locale === "ar" ? "نوع المشاركة" : "Participation type"}</span><select><option>{locale === "ar" ? "شاعر" : "Poet"}</option><option>{locale === "ar" ? "كاتب" : "Writer"}</option><option>{locale === "ar" ? "فنان" : "Artist"}</option></select></label></> : <label><span>{locale === "ar" ? "الموضوع" : "Subject"}</span><input /></label>}
      <label className="field-full"><span>{participation ? (locale === "ar" ? "نبذة ورسالة" : "Bio and message") : (locale === "ar" ? "الرسالة *" : "Message *")}</span><textarea rows={6} required={!participation} /></label>
      <label className="consent field-full"><input type="checkbox" required /><span>{locale === "ar" ? "أوافق على استخدام البيانات للتواصل بخصوص هذا الطلب." : "I consent to the use of my data to respond to this request."}</span></label>
    </div>
    <button className="button button-primary" type="submit">{locale === "ar" ? "إرسال" : "Submit"}</button>
    {submitted ? <p className="success-message">{locale === "ar" ? "هذه معاينة تجريبية: تم إظهار حالة النجاح، وسيتم ربط التخزين والبريد لاحقًا." : "Demo preview: the success state is shown. Storage and email will be connected later."}</p> : null}
  </form>;
}
