import type { Language } from "@/content/types";

export const ANALYTICS_EVENT_NAMES = [
  "lesson_start",
  "lesson_complete",
  "quiz_submit",
  "source_drawer_open",
  "language_switch",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];
export type PublicLessonSlug = "al-fatihah-lesson-1" | "abu-bakr-lesson-1" | "abu-bakr-lesson-2";
export type SourceDrawerContext = "section_sources" | "all_sources";

type SectionSourcesProperties = {
  lesson_slug: PublicLessonSlug;
  language: Language;
  source_context: "section_sources";
  card_index: number;
  card_count: number;
};

type AllSourcesProperties = {
  lesson_slug: PublicLessonSlug;
  language: Language;
  source_context: "all_sources";
  card_index?: never;
  card_count?: never;
};

export type AnalyticsEventProperties = {
  lesson_start: { lesson_slug: PublicLessonSlug; language: Language };
  lesson_complete: { lesson_slug: PublicLessonSlug; language: Language };
  quiz_submit: { lesson_slug: PublicLessonSlug; language: Language; correct: number; total: number };
  source_drawer_open: SectionSourcesProperties | AllSourcesProperties;
  language_switch: { public_path: string; previous_language: Language; next_language: Language };
};

export type AnalyticsEvent<K extends AnalyticsEventName = AnalyticsEventName> = {
  name: K;
  properties: AnalyticsEventProperties[K];
};

export interface AnalyticsProvider {
  track(event: AnalyticsEvent): void | Promise<void>;
}

const PUBLIC_LESSON_SLUGS = new Set<PublicLessonSlug>(["al-fatihah-lesson-1", "abu-bakr-lesson-1", "abu-bakr-lesson-2"]);
const SOURCE_CONTEXTS = new Set<SourceDrawerContext>(["section_sources", "all_sources"]);
const PUBLIC_PATH = /^(?:\/(?:quran|sahabah|feedback)?|\/quran\/al-fatihah(?:\/lesson-1)?|\/sahabah\/abu-bakr(?:\/lesson-(?:[1-9]|1[01]))?)$/;

let provider: AnalyticsProvider | null = null;
let allowAutomatedTestDispatch = false;

function language(value: unknown): Language | null {
  return value === "ar" || value === "en" ? value : null;
}

function lessonSlug(value: unknown): PublicLessonSlug | null {
  return typeof value === "string" && PUBLIC_LESSON_SLUGS.has(value as PublicLessonSlug) ? (value as PublicLessonSlug) : null;
}

function boundedInteger(value: unknown, minimum: number, maximum: number): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= minimum && value <= maximum ? value : null;
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]) {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}

/** Strip query/hash data and admit only routes that are public in this prototype. */
export function normalizePublicPath(value: string): string | null {
  try {
    const path = new URL(value, "https://public-path.invalid").pathname.replace(/\/$/, "") || "/";
    return PUBLIC_PATH.test(path) ? path : null;
  } catch {
    return null;
  }
}

/** Runtime validation is intentionally redundant with TypeScript so cast/JS callers cannot leak extra fields. */
export function sanitizeAnalyticsEvent(name: unknown, value: unknown): AnalyticsEvent | null {
  if (typeof name !== "string" || !ANALYTICS_EVENT_NAMES.includes(name as AnalyticsEventName)) return null;
  const properties = record(value);
  if (!properties) return null;

  if (name === "lesson_start" || name === "lesson_complete") {
    const slug = lessonSlug(properties.lesson_slug);
    const interfaceLanguage = language(properties.language);
    return slug && interfaceLanguage ? { name, properties: { lesson_slug: slug, language: interfaceLanguage } } : null;
  }

  if (name === "quiz_submit") {
    const slug = lessonSlug(properties.lesson_slug);
    const interfaceLanguage = language(properties.language);
    const total = boundedInteger(properties.total, 1, 100);
    const correct = boundedInteger(properties.correct, 0, 100);
    return slug && interfaceLanguage && total !== null && correct !== null && correct <= total
      ? { name, properties: { lesson_slug: slug, language: interfaceLanguage, correct, total } }
      : null;
  }

  if (name === "source_drawer_open") {
    const slug = lessonSlug(properties.lesson_slug);
    const interfaceLanguage = language(properties.language);
    const sourceContext = typeof properties.source_context === "string" && SOURCE_CONTEXTS.has(properties.source_context as SourceDrawerContext)
      ? (properties.source_context as SourceDrawerContext)
      : null;
    if (!slug || !interfaceLanguage || !sourceContext) return null;
    if (sourceContext === "all_sources") {
      if (!hasOnlyKeys(properties, ["lesson_slug", "language", "source_context"])) return null;
      return { name, properties: { lesson_slug: slug, language: interfaceLanguage, source_context: "all_sources" } };
    }

    if (!hasOnlyKeys(properties, ["lesson_slug", "language", "source_context", "card_index", "card_count"])) return null;
    const cardIndex = boundedInteger(properties.card_index, 1, 100);
    const cardCount = boundedInteger(properties.card_count, 1, 100);
    if (cardIndex === null || cardCount === null || cardIndex > cardCount) return null;
    return {
      name,
      properties: {
        lesson_slug: slug,
        language: interfaceLanguage,
        source_context: "section_sources",
        card_index: cardIndex,
        card_count: cardCount,
      },
    };
  }

  const previousLanguage = language(properties.previous_language);
  const nextLanguage = language(properties.next_language);
  const publicPath = typeof properties.public_path === "string" ? normalizePublicPath(properties.public_path) : null;
  return previousLanguage && nextLanguage && previousLanguage !== nextLanguage && publicPath
    ? { name: "language_switch", properties: { public_path: publicPath, previous_language: previousLanguage, next_language: nextLanguage } }
    : null;
}

function automatedTestEnvironment() {
  return process.env.NODE_ENV === "test" || (typeof navigator !== "undefined" && navigator.webdriver === true);
}

/** Provider failures are swallowed by design: learning interactions must remain fully functional. */
export function trackAnalytics<K extends AnalyticsEventName>(name: K, properties: AnalyticsEventProperties[K]): boolean {
  const event = sanitizeAnalyticsEvent(name, properties);
  if (!event || !provider || (automatedTestEnvironment() && !allowAutomatedTestDispatch)) return false;
  try {
    const result = provider.track(event);
    if (result && typeof result.then === "function") void result.catch(() => undefined);
    return true;
  } catch {
    return false;
  }
}

/** Active analytics is deliberately deferred for the free-only alpha; production leaves this unset. */
export function configureAnalyticsProvider(nextProvider: AnalyticsProvider | null) {
  provider = nextProvider;
  allowAutomatedTestDispatch = false;
}

/** Explicit opt-in for unit tests that intentionally inspect emitted events. */
export function setAnalyticsProviderForTests(nextProvider: AnalyticsProvider | null) {
  provider = nextProvider;
  allowAutomatedTestDispatch = nextProvider !== null;
}
