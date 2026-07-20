"use client";

import { FormEvent, useState } from "react";
import type { Locale } from "@/i18n/config";

type FormState = "idle" | "loading" | "success" | "error" | "rateLimited";

export function DemoForm({
  locale,
  type,
}: {
  locale: Locale;
  type: "contact" | "participation";
}) {
  const [state, setState] = useState<FormState>("idle");
  const participation = type === "participation";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    const form = new FormData(event.currentTarget);

    const body = participation
      ? {
          fullName: form.get("name"),
          email: form.get("email"),
          country: form.get("country"),
          city: form.get("city"),
          whatsapp: form.get("whatsapp"),
          participationType: form.get("participationType"),
          shortBio: form.get("shortBio"),
          externalUrl: form.get("externalUrl"),
          message: form.get("message"),
          consent: form.get("consent") === "on",
          website: form.get("website"),
        }
      : {
          name: form.get("name"),
          email: form.get("email"),
          subject: form.get("subject"),
          externalUrl: form.get("externalUrl"),
          message: form.get("message"),
          consent: form.get("consent") === "on",
          website: form.get("website"),
        };

    try {
      const response = await fetch(
        `/api/public/${participation ? "participation" : "contact"}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (response.status === 429) {
        setState("rateLimited");
        return;
      }
      if (!response.ok) throw new Error("Submission failed");
      setState("success");
      event.currentTarget.reset();
    } catch {
      setState("error");
    }
  }

  return (
    <form className="form-card card" onSubmit={submit}>
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="honeypot"
        aria-hidden="true"
      />
      <div className="form-grid">
        <label>
          <span>{locale === "ar" ? "الاسم الكامل *" : "Full name *"}</span>
          <input name="name" required />
        </label>
        <label>
          <span>{locale === "ar" ? "البريد الإلكتروني *" : "Email *"}</span>
          <input name="email" type="email" required />
        </label>

        {participation ? (
          <>
            <label>
              <span>{locale === "ar" ? "الدولة *" : "Country *"}</span>
              <input name="country" required />
            </label>
            <label>
              <span>{locale === "ar" ? "المدينة" : "City"}</span>
              <input name="city" />
            </label>
            <label>
              <span>WhatsApp *</span>
              <input name="whatsapp" required />
            </label>
            <label>
              <span>{locale === "ar" ? "نوع المشاركة" : "Participation type"}</span>
              <select name="participationType">
                <option value="poet">{locale === "ar" ? "شاعر" : "Poet"}</option>
                <option value="writer">{locale === "ar" ? "كاتب" : "Writer"}</option>
                <option value="artist">{locale === "ar" ? "فنان" : "Artist"}</option>
                <option value="media">{locale === "ar" ? "إعلامي" : "Media"}</option>
                <option value="other">{locale === "ar" ? "أخرى" : "Other"}</option>
              </select>
            </label>
            <label className="field-full">
              <span>{locale === "ar" ? "رابط لأعمالك" : "Portfolio URL"}</span>
              <input name="externalUrl" type="url" placeholder="https://" />
            </label>
            <label className="field-full">
              <span>{locale === "ar" ? "نبذة قصيرة" : "Short biography"}</span>
              <textarea name="shortBio" rows={4} />
            </label>
          </>
        ) : (
          <>
            <label>
              <span>{locale === "ar" ? "الهاتف أو واتساب" : "Phone or WhatsApp"}</span>
              <input name="phoneOrWhatsapp" />
            </label>
            <label>
              <span>{locale === "ar" ? "الموضوع" : "Subject"}</span>
              <input name="subject" />
            </label>
          </>
        )}

        <label className="field-full">
          <span>
            {locale === "ar"
              ? participation
                ? "رسالة أو ملاحظات"
                : "الرسالة *"
              : participation
                ? "Message or notes"
                : "Message *"}
          </span>
          <textarea name="message" rows={6} required={!participation} />
        </label>
        <label className="consent field-full">
          <input name="consent" type="checkbox" required />
          <span>
            {locale === "ar"
              ? "أوافق على استخدام البيانات للتواصل بخصوص هذا الطلب."
              : "I consent to the use of my data to respond to this request."}
          </span>
        </label>
      </div>

      <button
        className="button button-primary"
        disabled={state === "loading"}
        type="submit"
      >
        {state === "loading"
          ? locale === "ar"
            ? "جارٍ الإرسال..."
            : "Sending..."
          : locale === "ar"
            ? "إرسال"
            : "Submit"}
      </button>
      {state === "success" ? (
        <p className="success-message">
          {locale === "ar"
            ? "تم حفظ الطلب بنجاح داخل لوحة الإدارة."
            : "Your request was saved successfully in the admin panel."}
        </p>
      ) : null}
      {state === "rateLimited" ? (
        <p className="error-message">
          {locale === "ar"
            ? "تم إرسال عدة طلبات خلال وقت قصير. حاول لاحقًا."
            : "Too many requests were submitted. Please try again later."}
        </p>
      ) : null}
      {state === "error" ? (
        <p className="error-message">
          {locale === "ar"
            ? "تعذر الإرسال. تحقق من البيانات وحاول مجددًا."
            : "Submission failed. Check the form and try again."}
        </p>
      ) : null}
    </form>
  );
}
