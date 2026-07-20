"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { contactSchema, participationSchema } from "@/lib/forms/schemas";
import { Icon } from "@/components/ui/Icon";

type FormState = "idle" | "loading" | "success" | "error" | "rateLimited";
type FieldErrors = Record<string, string>;

type APIResponse = { ok?: boolean; error?: string; reference?: string; fieldErrors?: Record<string, string[]> };

const messages = {
  ar: {
    name_min: "يرجى إدخال اسم من حرفين على الأقل.", email_invalid: "أدخل بريدًا إلكترونيًا صحيحًا.", message_min: "يجب ألا تقل الرسالة عن 10 أحرف.", consent_required: "يجب الموافقة على استخدام البيانات.", country_min: "يرجى إدخال الدولة.", whatsapp_min: "أدخل رقم WhatsApp صحيحًا.", url_invalid: "أدخل رابطًا صحيحًا يبدأ بـ http:// أو https://.", generic: "تعذر الإرسال بسبب خطأ تقني. حاول مجددًا.", invalid: "راجع الحقول المعلّمة ثم أعد الإرسال.", rate: "تم إرسال عدة طلبات خلال وقت قصير. حاول لاحقًا.", success: "تم استلام الطلب بنجاح.", sending: "جارٍ الإرسال...", submit: "إرسال",
  },
  en: {
    name_min: "Enter at least two characters.", email_invalid: "Enter a valid email address.", message_min: "The message must contain at least 10 characters.", consent_required: "You must consent to the use of your data.", country_min: "Enter your country.", whatsapp_min: "Enter a valid WhatsApp number.", url_invalid: "Enter a valid URL beginning with http:// or https://.", generic: "A technical error prevented submission. Please try again.", invalid: "Review the highlighted fields and submit again.", rate: "Too many requests were submitted. Please try again later.", success: "Your request was received successfully.", sending: "Sending...", submit: "Submit",
  },
} as const;

function formObject(form: FormData, participation: boolean) {
  return participation
    ? { fullName: form.get("fullName"), email: form.get("email"), country: form.get("country"), city: form.get("city"), whatsapp: form.get("whatsapp"), participationType: form.get("participationType"), shortBio: form.get("shortBio"), externalUrl: form.get("externalUrl"), requestedEventSlug: form.get("requestedEventSlug"), message: form.get("message"), consent: form.get("consent") === "on", website: form.get("website") }
    : { name: form.get("name"), email: form.get("email"), phoneOrWhatsapp: form.get("phoneOrWhatsapp"), subject: form.get("subject"), message: form.get("message"), consent: form.get("consent") === "on", website: form.get("website") };
}

export function DemoForm({ locale, type, requestedEvent }: { locale: Locale; type: "contact" | "participation"; requestedEvent?: { slug: string; title: string } }) {
  const [state, setState] = useState<FormState>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [reference, setReference] = useState<string>();
  const participation = type === "participation";
  const t = messages[locale];

  const messageFor = (code?: string) => code && code in t ? t[code as keyof typeof t] : locale === "ar" ? "تحقق من هذا الحقل." : "Check this field.";
  const errorFor = (name: string) => errors[name] ? <small className="field-error" id={`${name}-error`}>{errors[name]}</small> : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setState("loading"); setErrors({}); setReference(undefined);
    const body = formObject(new FormData(form), participation);
    const result = (participation ? participationSchema : contactSchema).safeParse(body);
    if (!result.success) {
      const next: FieldErrors = {};
      result.error.issues.forEach((issue) => { const field = String(issue.path[0] || "form"); if (!next[field]) next[field] = messageFor(issue.message); });
      setErrors(next); setState("error");
      const first = form.elements.namedItem(Object.keys(next)[0]); if (first instanceof HTMLElement) first.focus();
      return;
    }
    try {
      const response = await fetch(`/api/public/${participation ? "participation" : "contact"}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(result.data) });
      const payload = await response.json().catch(() => ({})) as APIResponse;
      if (response.status === 429) { setState("rateLimited"); return; }
      if (!response.ok) {
        if (payload.fieldErrors) {
          const next: FieldErrors = {};
          Object.entries(payload.fieldErrors).forEach(([key, value]) => { next[key] = messageFor(value?.[0]); });
          setErrors(next);
          window.requestAnimationFrame(() => {
            const first = form.elements.namedItem(Object.keys(next)[0]);
            if (first instanceof HTMLElement) first.focus();
          });
        }
        setState("error"); return;
      }
      setReference(payload.reference); setState("success"); form.reset();
    } catch { setState("error"); }
  }

  const inputError = (name: string) => errors[name] ? { "aria-invalid": true, "aria-describedby": `${name}-error` } : {};

  return (
    <form className="form-card card" onSubmit={submit} noValidate>
      <input name="website" tabIndex={-1} autoComplete="off" className="honeypot" aria-hidden="true" />
      {requestedEvent ? <div className="selected-event"><Icon name="calendar" /><div><span>{locale === "ar" ? "طلب مشاركة في" : "Participation request for"}</span><strong>{requestedEvent.title}</strong></div><input type="hidden" name="requestedEventSlug" value={requestedEvent.slug} /></div> : null}
      <div className="form-grid">
        <label><span>{locale === "ar" ? "الاسم الكامل *" : "Full name *"}</span><input name={participation ? "fullName" : "name"} autoComplete="name" required {...inputError(participation ? "fullName" : "name")} />{errorFor(participation ? "fullName" : "name")}</label>
        <label><span>{locale === "ar" ? "البريد الإلكتروني *" : "Email *"}</span><input name="email" type="email" dir="ltr" autoComplete="email" required {...inputError("email")} />{errorFor("email")}</label>
        {participation ? <>
          <label><span>{locale === "ar" ? "الدولة *" : "Country *"}</span><input name="country" autoComplete="country-name" required {...inputError("country")} />{errorFor("country")}</label>
          <label><span>{locale === "ar" ? "المدينة" : "City"}</span><input name="city" autoComplete="address-level2" /></label>
          <label><span>WhatsApp *</span><input name="whatsapp" type="tel" dir="ltr" inputMode="tel" autoComplete="tel" required {...inputError("whatsapp")} />{errorFor("whatsapp")}</label>
          <label><span>{locale === "ar" ? "نوع المشاركة" : "Participation type"}</span><select name="participationType"><option value="poet">{locale === "ar" ? "شاعر" : "Poet"}</option><option value="writer">{locale === "ar" ? "كاتب" : "Writer"}</option><option value="artist">{locale === "ar" ? "فنان" : "Artist"}</option><option value="media">{locale === "ar" ? "إعلامي" : "Media"}</option><option value="other">{locale === "ar" ? "أخرى" : "Other"}</option></select></label>
          <label className="field-full"><span>{locale === "ar" ? "رابط لأعمالك" : "Portfolio URL"}</span><input name="externalUrl" type="url" dir="ltr" placeholder="https://" {...inputError("externalUrl")} />{errorFor("externalUrl")}</label>
          <label className="field-full"><span>{locale === "ar" ? "نبذة قصيرة" : "Short biography"}</span><textarea name="shortBio" rows={4} maxLength={1200} /></label>
        </> : <>
          <label><span>{locale === "ar" ? "الهاتف أو واتساب" : "Phone or WhatsApp"}</span><input name="phoneOrWhatsapp" type="tel" dir="ltr" inputMode="tel" autoComplete="tel" /></label>
          <label><span>{locale === "ar" ? "الموضوع" : "Subject"}</span><input name="subject" maxLength={180} /></label>
        </>}
        <label className="field-full"><span>{locale === "ar" ? participation ? "رسالة أو ملاحظات" : "الرسالة *" : participation ? "Message or notes" : "Message *"}</span><textarea name="message" rows={6} required={!participation} minLength={participation ? undefined : 10} {...inputError("message")} />{errorFor("message")}{!participation ? <small className="field-help">{locale === "ar" ? "10 أحرف على الأقل" : "At least 10 characters"}</small> : null}</label>
        <label className="consent field-full"><input name="consent" type="checkbox" required {...inputError("consent")} /><span>{locale === "ar" ? "أوافق على استخدام البيانات للتواصل بخصوص هذا الطلب." : "I consent to the use of my data to respond to this request."}</span>{errorFor("consent")}</label>
      </div>
      <button className="button button-primary" disabled={state === "loading"} type="submit">{state === "loading" ? t.sending : t.submit}</button>
      <div aria-live="polite">
        {state === "success" ? <p className="form-message success-message"><strong>{t.success}</strong>{reference ? <span>{locale === "ar" ? `رقم المرجع: ${reference}` : `Reference: ${reference}`}</span> : null}</p> : null}
        {state === "rateLimited" ? <p className="form-message error-message">{t.rate}</p> : null}
        {state === "error" ? <p className="form-message error-message">{Object.keys(errors).length ? t.invalid : t.generic}</p> : null}
      </div>
    </form>
  );
}
