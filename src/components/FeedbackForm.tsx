"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { FEEDBACK_CATEGORIES, FEEDBACK_CONTEXT_KEY, FEEDBACK_LIMITS, type FeedbackCategory } from "@/lib/feedback";
import { normalizePublicPath } from "@/lib/analytics";

const categoryLabels: Record<FeedbackCategory, { ar: string; en: string }> = {
  unclear: { ar: "شيء غير واضح", en: "Something unclear" },
  technical: { ar: "مشكلة تقنية", en: "Technical problem" },
  source_concern: { ar: "ملاحظة على مصدر أو إحالة", en: "Source or citation concern" },
  learning_suggestion: { ar: "اقتراح لتجربة التعلّم", en: "Learning-experience suggestion" },
  general: { ar: "ملاحظة عامة للاختبار الأولي", en: "General alpha feedback" },
};

type SubmissionState = "idle" | "sending" | "success" | "unavailable" | "error";
type FieldErrors = Partial<Record<"category" | "message" | "contact" | "contactConsent" | "form", string>>;

export function FeedbackForm() {
  const { language } = useLanguage();
  const [category, setCategory] = useState<FeedbackCategory>("unclear");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [contactConsent, setContactConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [pageContext, setPageContext] = useState("/feedback");
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const startedAt = useRef(0);
  const submittingRef = useRef(false);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
    const stored = sessionStorage.getItem(FEEDBACK_CONTEXT_KEY);
    const safe = stored ? normalizePublicPath(stored) : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (safe) setPageContext(safe);
  }, []);

  const copy = language === "ar" ? {
    eyebrow: "الاختبار الداخلي",
    title: "أرسل ملاحظتك",
    intro: "تساعدنا الملاحظة المحددة والصريحة على تحسين الوضوح، والتوثيق، وتجربة التعلّم.",
    boundaryTitle: "ما الغرض من هذه القناة؟",
    boundary: "هذه القناة لملاحظات النسخة التجريبية فقط. ليست خدمة فتوى، ولا إرشادًا دينيًا شخصيًا، ولا قناة طوارئ، ولا مساحة لتعليقات عامة. لا ترسل مواقف دينية أو شخصية حساسة.",
    unavailable: "تُسلَّم الملاحظات عبر Formspree، وتُحفظ هناك بصورة خاصة لمدة تصل إلى 30 يومًا في هذه الخطة. قد تجري المعالجة في الولايات المتحدة أو دوليًا، كما سيعالج مزوّد بريد محمد إشعار التسليم. لا ترسل معلومات شخصية أو مواقف دينية حساسة. البريد اختياري ولا يُستخدم إلا للرد على هذه الملاحظة بعد موافقتك. لا يعمل أي مزوّد تحليلات نشط في هذه النسخة الأولية.",
    category: "فئة الملاحظة",
    categoryHelp: "اختر أقرب غرض لملاحظتك.",
    message: "رسالة قصيرة",
    messageHelp: `من ${FEEDBACK_LIMITS.messageMin} إلى ${FEEDBACK_LIMITS.messageMax} حرفًا. لا تدرج معلومات شخصية حساسة.`,
    context: "سياق الصفحة الآمن",
    contextHelp: "مسار عام فقط، بلا استعلامات أو معرّفات بحث داخلية.",
    interfaceLanguage: "لغة الواجهة",
    optionalContact: "بريد إلكتروني للمتابعة (اختياري)",
    contactHelp: "أضفه فقط إذا أردت ردًا. لن يُرسل دون موافقتك أدناه.",
    consent: "أوافق على استخدام هذا البريد للرد على هذه الملاحظة فقط.",
    send: "إرسال الملاحظة",
    sending: "جارٍ الإرسال…",
    sent: "أُرسلت ملاحظتك بنجاح.",
    notSent: "لم تُرسل ملاحظتك: خدمة التسليم غير متاحة بعد. لم نفقد النص؛ يمكنك نسخه والمحاولة بعد تفعيل الخدمة.",
    failed: "تعذر إرسال الملاحظة. لم نفقد النص؛ راجع الحقول أو انسخه ثم حاول لاحقًا.",
    validation: "راجع الحقول المعلّمة ثم حاول مرة أخرى.",
    required: "اكتب رسالة من ١٠ أحرف على الأقل.",
    contactInvalid: "أدخل بريدًا إلكترونيًا صالحًا، أو اترك الحقل فارغًا.",
    consentRequired: "يلزم تحديد الموافقة عند إضافة بريد إلكتروني.",
  } : {
    eyebrow: "Internal alpha",
    title: "Send feedback",
    intro: "Specific, candid feedback helps us improve clarity, source traceability, and the learning experience.",
    boundaryTitle: "What is this channel for?",
    boundary: "This channel is only for alpha feedback. It is not a fatwa service, personal religious counselling, an emergency channel, or public comments. Do not submit sensitive personal or religious situations.",
    unavailable: "Feedback is delivered through Formspree and retained there privately for up to 30 days on this plan. Processing may occur in the United States or internationally, and Mohamed’s receiving email provider will also process the delivery notification. Do not submit sensitive personal or religious situations. Optional email is used only to reply to this feedback after your consent. No active analytics provider operates during this initial alpha.",
    category: "Feedback category",
    categoryHelp: "Choose the closest purpose for your feedback.",
    message: "Short message",
    messageHelp: `${FEEDBACK_LIMITS.messageMin}–${FEEDBACK_LIMITS.messageMax} characters. Do not include sensitive personal information.`,
    context: "Safe page context",
    contextHelp: "Public path only, with no query strings or internal research identifiers.",
    interfaceLanguage: "Interface language",
    optionalContact: "Follow-up email (optional)",
    contactHelp: "Add this only if you want a reply. It will not be sent without your consent below.",
    consent: "I consent to this email being used only to reply to this feedback.",
    send: "Send feedback",
    sending: "Sending…",
    sent: "Your feedback was sent successfully.",
    notSent: "Your feedback was not sent: delivery is not available yet. Your text is still here so you can copy it and retry after delivery is enabled.",
    failed: "Feedback could not be sent. Your text is still here; review the fields or copy it and try later.",
    validation: "Review the marked fields and try again.",
    required: "Enter a message of at least 10 characters.",
    contactInvalid: "Enter a valid email address or leave the field empty.",
    consentRequired: "Consent is required when an email address is provided.",
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmissionState("sending");
    setFieldErrors({});
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message, pageContext, language, contact, contactConsent, website, startedAt: startedAt.current }),
      });
      const result = await response.json() as { ok?: boolean; code?: string; errors?: FieldErrors };
      if (response.ok && result.ok) {
        setSubmissionState("success");
        setMessage("");
        setContact("");
        setContactConsent(false);
        startedAt.current = Date.now();
      } else if (result.code === "delivery_unavailable") {
        setSubmissionState("unavailable");
      } else {
        setFieldErrors(result.errors ?? {});
        setSubmissionState("error");
      }
    } catch {
      setSubmissionState("error");
    } finally {
      submittingRef.current = false;
    }
    window.requestAnimationFrame(() => statusRef.current?.focus());
  }

  const statusMessage = submissionState === "success" ? copy.sent : submissionState === "unavailable" ? copy.notSent : submissionState === "error" ? (Object.keys(fieldErrors).length ? copy.validation : copy.failed) : "";

  return (
    <main className="feedback-page">
      <div className="shell narrow feedback-shell">
        <header className="feedback-heading">
          <span className="eyebrow">{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p>{copy.intro}</p>
        </header>

        <section className="feedback-boundary" aria-labelledby="feedback-boundary-title">
          <h2 id="feedback-boundary-title">{copy.boundaryTitle}</h2>
          <p>{copy.boundary}</p>
        </section>
        <p className="feedback-unavailable-note" role="note">{copy.unavailable}</p>

        <form className="feedback-form" onSubmit={submit} noValidate>
          <div className="form-field">
            <label htmlFor="feedback-category">{copy.category}</label>
            <p id="feedback-category-help">{copy.categoryHelp}</p>
            <select id="feedback-category" value={category} onChange={(event) => setCategory(event.target.value as FeedbackCategory)} aria-describedby="feedback-category-help" aria-invalid={Boolean(fieldErrors.category)}>
              {FEEDBACK_CATEGORIES.map((item) => <option value={item} key={item}>{categoryLabels[item][language]}</option>)}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="feedback-message">{copy.message}</label>
            <p id="feedback-message-help">{copy.messageHelp}</p>
            <textarea id="feedback-message" value={message} onChange={(event) => setMessage(event.target.value)} minLength={FEEDBACK_LIMITS.messageMin} maxLength={FEEDBACK_LIMITS.messageMax} required rows={7} dir={language === "ar" ? "rtl" : "ltr"} aria-describedby="feedback-message-help feedback-message-count" aria-invalid={Boolean(fieldErrors.message)} />
            <span id="feedback-message-count" className="character-count" dir="ltr" aria-live="polite"><bdi dir="ltr">{message.length} / {FEEDBACK_LIMITS.messageMax}</bdi></span>
            {fieldErrors.message && <span className="field-error" role="alert">{copy.required}</span>}
          </div>

          <div className="feedback-context-grid">
            <div className="form-field">
              <label htmlFor="feedback-context">{copy.context}</label>
              <p id="feedback-context-help">{copy.contextHelp}</p>
              <input id="feedback-context" value={pageContext} readOnly aria-describedby="feedback-context-help" dir="ltr" />
            </div>
            <div className="form-field">
              <label htmlFor="feedback-language">{copy.interfaceLanguage}</label>
              <input id="feedback-language" value={language === "ar" ? "العربية" : "English"} readOnly />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="feedback-contact">{copy.optionalContact}</label>
            <p id="feedback-contact-help">{copy.contactHelp}</p>
            <input id="feedback-contact" type="email" value={contact} onChange={(event) => setContact(event.target.value)} maxLength={FEEDBACK_LIMITS.contactMax} autoComplete="email" inputMode="email" dir="ltr" aria-describedby="feedback-contact-help" aria-invalid={Boolean(fieldErrors.contact)} />
            {fieldErrors.contact && <span className="field-error" role="alert">{copy.contactInvalid}</span>}
          </div>

          <label className="consent-field">
            <input type="checkbox" checked={contactConsent} onChange={(event) => setContactConsent(event.target.checked)} disabled={!contact} aria-invalid={Boolean(fieldErrors.contactConsent)} />
            <span>{copy.consent}</span>
          </label>
          {fieldErrors.contactConsent && <span className="field-error" role="alert">{copy.consentRequired}</span>}

          <div className="feedback-honeypot" aria-hidden="true">
            <label htmlFor="feedback-website">Website</label>
            <input id="feedback-website" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" />
          </div>

          <button className="primary-button" type="submit" disabled={submissionState === "sending" || message.length < FEEDBACK_LIMITS.messageMin}>
            {submissionState === "sending" ? copy.sending : copy.send}
          </button>

          {statusMessage && <div ref={statusRef} className="feedback-status" data-state={submissionState} role={submissionState === "success" ? "status" : "alert"} tabIndex={-1}>{statusMessage}</div>}
        </form>
      </div>
    </main>
  );
}
