import type { Language } from "@/content/types";
import { normalizePublicPath } from "./analytics";

export const FEEDBACK_CATEGORIES = ["unclear", "technical", "source_concern", "learning_suggestion", "general"] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];
export const FEEDBACK_CONTEXT_KEY = "islamic-library-feedback-page-context";

export const FEEDBACK_LIMITS = {
  messageMin: 10,
  messageMax: 1200,
  contactMax: 254,
  minimumCompletionMs: 3000,
  maximumFormAgeMs: 2 * 60 * 60 * 1000,
  maximumRequestCharacters: 5000,
} as const;

export type ValidFeedback = {
  category: FeedbackCategory;
  message: string;
  pageContext: string;
  language: Language;
  contact?: string;
  contactConsent: boolean;
};

export type FeedbackErrors = Partial<Record<"category" | "message" | "pageContext" | "language" | "contact" | "contactConsent" | "form", string>>;

export type FeedbackValidationResult =
  | { ok: true; data: ValidFeedback }
  | { ok: false; errors: FeedbackErrors };

function valueRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function trimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

/** Keep learner feedback as bounded plain text with predictable newlines and no control bytes. */
export function normalizeFeedbackMessage(value: unknown) {
  return trimmed(value)
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
}

function validContact(value: string) {
  return value.length <= FEEDBACK_LIMITS.contactMax && !/[\r\n]/.test(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateFeedback(value: unknown, now = Date.now()): FeedbackValidationResult {
  const input = valueRecord(value);
  if (!input) return { ok: false, errors: { form: "invalid_request" } };
  const errors: FeedbackErrors = {};
  const category = FEEDBACK_CATEGORIES.includes(input.category as FeedbackCategory) ? (input.category as FeedbackCategory) : null;
  const message = normalizeFeedbackMessage(input.message);
  const pageContext = typeof input.pageContext === "string" ? normalizePublicPath(input.pageContext) : null;
  const language = input.language === "ar" || input.language === "en" ? input.language : null;
  const contact = trimmed(input.contact);
  const contactConsent = input.contactConsent === true;
  const honeypot = trimmed(input.website);
  const startedAt = typeof input.startedAt === "number" && Number.isFinite(input.startedAt) ? input.startedAt : null;

  if (!category) errors.category = "invalid_category";
  if (message.length < FEEDBACK_LIMITS.messageMin) errors.message = "message_too_short";
  else if (message.length > FEEDBACK_LIMITS.messageMax) errors.message = "message_too_long";
  if (!pageContext) errors.pageContext = "invalid_page_context";
  if (!language) errors.language = "invalid_language";
  if (contact && !validContact(contact)) errors.contact = "invalid_contact";
  if (contact && !contactConsent) errors.contactConsent = "consent_required";
  if (honeypot) errors.form = "spam_rejected";
  if (startedAt === null || now - startedAt < FEEDBACK_LIMITS.minimumCompletionMs || now - startedAt > FEEDBACK_LIMITS.maximumFormAgeMs) errors.form = "spam_rejected";

  if (Object.keys(errors).length || !category || !pageContext || !language) return { ok: false, errors };
  return {
    ok: true,
    data: {
      category,
      message,
      pageContext,
      language,
      ...(contact ? { contact } : {}),
      contactConsent: contact ? contactConsent : false,
    },
  };
}
