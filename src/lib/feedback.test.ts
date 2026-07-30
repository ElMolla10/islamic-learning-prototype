import { describe, expect, it } from "vitest";
import { FEEDBACK_LIMITS, validateFeedback } from "./feedback";

const now = 2_000_000;
const valid = {
  category: "source_concern",
  message: "The citation location was difficult to understand.",
  pageContext: "/quran/al-fatihah/lesson-1?private=value#card-2",
  language: "en",
  contact: "tester@example.com",
  contactConsent: true,
  website: "",
  startedAt: now - FEEDBACK_LIMITS.minimumCompletionMs - 1,
};

describe("feedback validation", () => {
  it("accepts only allowlisted categories and normalizes public page context", () => {
    expect(validateFeedback(valid, now)).toEqual({
      ok: true,
      data: {
        category: "source_concern",
        message: valid.message,
        pageContext: "/quran/al-fatihah/lesson-1",
        language: "en",
        contact: "tester@example.com",
        contactConsent: true,
      },
    });
    const invalid = validateFeedback({ ...valid, category: "fatwa_request" }, now);
    expect(invalid).toMatchObject({ ok: false, errors: { category: "invalid_category" } });
  });

  it("enforces message and contact length, format, and explicit consent", () => {
    expect(validateFeedback({ ...valid, message: "short" }, now)).toMatchObject({ ok: false, errors: { message: "message_too_short" } });
    expect(validateFeedback({ ...valid, message: "x".repeat(FEEDBACK_LIMITS.messageMax + 1) }, now)).toMatchObject({ ok: false, errors: { message: "message_too_long" } });
    expect(validateFeedback({ ...valid, contact: "not-an-email" }, now)).toMatchObject({ ok: false, errors: { contact: "invalid_contact" } });
    expect(validateFeedback({ ...valid, contactConsent: false }, now)).toMatchObject({ ok: false, errors: { contactConsent: "consent_required" } });
  });

  it("rejects private contexts, honeypot input, and implausibly fast or stale submissions", () => {
    expect(validateFeedback({ ...valid, pageContext: "/private/research/RQ03" }, now)).toMatchObject({ ok: false, errors: { pageContext: "invalid_page_context" } });
    expect(validateFeedback({ ...valid, website: "spam.example" }, now)).toMatchObject({ ok: false, errors: { form: "spam_rejected" } });
    expect(validateFeedback({ ...valid, startedAt: now - 100 }, now)).toMatchObject({ ok: false, errors: { form: "spam_rejected" } });
    expect(validateFeedback({ ...valid, startedAt: now - FEEDBACK_LIMITS.maximumFormAgeMs - 1 }, now)).toMatchObject({ ok: false, errors: { form: "spam_rejected" } });
  });

  it("does not require contact details when no reply is requested", () => {
    expect(validateFeedback({ ...valid, contact: "", contactConsent: false }, now)).toMatchObject({ ok: true, data: { contactConsent: false } });
  });

  it("normalizes feedback to bounded plain text without control bytes", () => {
    expect(validateFeedback({ ...valid, message: "  First line\r\nSecond\u0000 line  " }, now)).toMatchObject({
      ok: true,
      data: { message: "First line\nSecond line" },
    });
  });
});
