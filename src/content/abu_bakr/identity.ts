import rawLessonIdentities from "./lesson_identity.json";
import type { PublicLessonSlug } from "@/lib/analytics";

export type AbuBakrCanonicalSlug = string;

export type AbuBakrLessonIdentity = {
  canonicalSlug: AbuBakrCanonicalSlug;
  displayNumber: number;
  routeSlug: string;
  contentFolder: string;
  legacyProgressKey: string;
  legacyQuizKey: string;
  legacyCompletedLessonId: string;
  publicAnalyticsSlug: PublicLessonSlug | null;
  nextCanonicalSlug: AbuBakrCanonicalSlug | null;
};

type RawIdentity = {
  canonical_slug: unknown;
  website_display_number: unknown;
  public_route_slug: unknown;
  public_content_folder: unknown;
  legacy_progress_key: unknown;
  legacy_quiz_key: unknown;
  legacy_completed_lesson_id: unknown;
  public_analytics_slug: unknown;
  next_canonical_slug: unknown;
};

const EXACT_KEYS = [
  "canonical_slug",
  "website_display_number",
  "public_route_slug",
  "public_content_folder",
  "legacy_progress_key",
  "legacy_quiz_key",
  "legacy_completed_lesson_id",
  "public_analytics_slug",
  "next_canonical_slug",
] as const;

const PUBLIC_ANALYTICS_SLUGS = new Set<PublicLessonSlug>(["abu-bakr-lesson-1", "abu-bakr-lesson-2"]);
const CANONICAL_SLUG_PATTERN = /^abu_bakr\.lesson_[a-z0-9_]+$/;
const ROUTE_SLUG_PATTERN = /^lesson-([1-9][0-9]*)$/;
const CONTENT_FOLDER_PATTERN = /^lesson_[0-9]{2}(?:_[a-z0-9]+(?:_[a-z0-9]+)*)?$/;
const PUBLIC_ANALYTICS_SLUG_PATTERN = /^abu-bakr-lesson-[1-9][0-9]*$/;

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`Invalid Abu Bakr identity ${field}`);
  return value;
}

export function validateAbuBakrLessonIdentities(raw: unknown): AbuBakrLessonIdentity[] {
  if (!Array.isArray(raw) || raw.length === 0) throw new Error("Abu Bakr identity map must be a non-empty array");
  const identities = raw.map((candidate) => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) throw new Error("Invalid Abu Bakr identity entry");
    const record = candidate as unknown as RawIdentity & Record<string, unknown>;
    const keys = Object.keys(record).sort();
    if (keys.join("|") !== [...EXACT_KEYS].sort().join("|")) throw new Error("Unexpected Abu Bakr identity field");
    const displayNumber = record.website_display_number;
    if (!Number.isInteger(displayNumber) || Number(displayNumber) < 1) throw new Error("Invalid Abu Bakr display number");
    const analytics = record.public_analytics_slug;
    if (
      analytics !== null
      && (typeof analytics !== "string" || !PUBLIC_ANALYTICS_SLUG_PATTERN.test(analytics) || !PUBLIC_ANALYTICS_SLUGS.has(analytics as PublicLessonSlug))
    ) {
      throw new Error("Invalid Abu Bakr public analytics slug");
    }
    const nextCanonicalSlug = record.next_canonical_slug;
    if (nextCanonicalSlug !== null && (typeof nextCanonicalSlug !== "string" || !CANONICAL_SLUG_PATTERN.test(nextCanonicalSlug))) {
      throw new Error("Invalid Abu Bakr next canonical slug");
    }
    const canonicalSlug = requiredString(record.canonical_slug, "canonical slug");
    if (!CANONICAL_SLUG_PATTERN.test(canonicalSlug)) throw new Error("Invalid Abu Bakr canonical slug");
    const routeSlug = requiredString(record.public_route_slug, "route slug");
    const routeMatch = ROUTE_SLUG_PATTERN.exec(routeSlug);
    if (!routeMatch || Number(routeMatch[1]) !== Number(displayNumber)) throw new Error("Abu Bakr route/display mismatch");
    const contentFolder = requiredString(record.public_content_folder, "content folder");
    if (!CONTENT_FOLDER_PATTERN.test(contentFolder)) throw new Error("Unsafe Abu Bakr content folder");
    const expectedProgressKey = `islamic-library-sahabah-abu-bakr-lesson-${displayNumber}-progress`;
    const expectedQuizKey = `islamic-library-sahabah-abu-bakr-lesson-${displayNumber}-quiz`;
    const expectedCompletedLessonId = `abu-bakr-lesson-${displayNumber}`;
    const legacyProgressKey = requiredString(record.legacy_progress_key, "progress key");
    const legacyQuizKey = requiredString(record.legacy_quiz_key, "quiz key");
    const legacyCompletedLessonId = requiredString(record.legacy_completed_lesson_id, "completed lesson id");
    if (legacyProgressKey !== expectedProgressKey) throw new Error("Abu Bakr progress alias/display mismatch");
    if (legacyQuizKey !== expectedQuizKey) throw new Error("Abu Bakr quiz alias/display mismatch");
    if (legacyCompletedLessonId !== expectedCompletedLessonId) throw new Error("Abu Bakr completed alias/display mismatch");
    return {
      canonicalSlug,
      displayNumber: Number(displayNumber),
      routeSlug,
      contentFolder,
      legacyProgressKey,
      legacyQuizKey,
      legacyCompletedLessonId,
      publicAnalyticsSlug: analytics as PublicLessonSlug | null,
      nextCanonicalSlug: nextCanonicalSlug as AbuBakrCanonicalSlug | null,
    };
  });

  const uniqueFields: (keyof AbuBakrLessonIdentity)[] = [
    "canonicalSlug",
    "displayNumber",
    "routeSlug",
    "contentFolder",
    "legacyProgressKey",
    "legacyQuizKey",
    "legacyCompletedLessonId",
  ];
  for (const field of uniqueFields) {
    const values = identities.map((identity) => identity[field]);
    if (new Set(values).size !== values.length) throw new Error(`Duplicate Abu Bakr identity ${field}`);
  }
  const analyticsSlugs = identities.map((identity) => identity.publicAnalyticsSlug).filter((value): value is PublicLessonSlug => value !== null);
  if (new Set(analyticsSlugs).size !== analyticsSlugs.length) throw new Error("Duplicate Abu Bakr identity publicAnalyticsSlug");
  const canonicalSlugs = new Set(identities.map((identity) => identity.canonicalSlug));
  const nextSlugs = identities.map((identity) => identity.nextCanonicalSlug).filter((value): value is AbuBakrCanonicalSlug => value !== null);
  if (nextSlugs.some((slug) => !canonicalSlugs.has(slug))) throw new Error("Unknown Abu Bakr next canonical slug");
  if (new Set(nextSlugs).size !== nextSlugs.length) throw new Error("Duplicate Abu Bakr next canonical slug");

  const expectedDisplayNumbers = Array.from({ length: identities.length }, (_, index) => index + 1);
  const actualDisplayNumbers = identities.map((identity) => identity.displayNumber).sort((a, b) => a - b);
  if (actualDisplayNumbers.some((value, index) => value !== expectedDisplayNumbers[index])) {
    throw new Error("Abu Bakr display numbers must be exactly contiguous 1..N");
  }

  const byCanonicalSlug = new Map(identities.map((identity) => [identity.canonicalSlug, identity]));
  const fullyChecked = new Set<AbuBakrCanonicalSlug>();
  for (const start of canonicalSlugs) {
    let current: AbuBakrCanonicalSlug | null = start;
    const currentWalk = new Set<AbuBakrCanonicalSlug>();
    while (current !== null && !fullyChecked.has(current)) {
      if (currentWalk.has(current)) throw new Error("Cycle in Abu Bakr lesson path");
      currentWalk.add(current);
      current = byCanonicalSlug.get(current)?.nextCanonicalSlug ?? null;
    }
    for (const slug of currentWalk) fullyChecked.add(slug);
  }

  const heads = identities.filter((identity) => !nextSlugs.includes(identity.canonicalSlug));
  if (heads.length !== 1) throw new Error("Abu Bakr lesson path must have exactly one head");
  const terminals = identities.filter((identity) => identity.nextCanonicalSlug === null);
  if (terminals.length !== 1) throw new Error("Abu Bakr lesson path must have exactly one terminal");

  const visited = new Set<AbuBakrCanonicalSlug>();
  let current: AbuBakrCanonicalSlug | null = heads[0].canonicalSlug;
  while (current !== null) {
    if (visited.has(current)) throw new Error("Cycle in Abu Bakr lesson path");
    visited.add(current);
    current = byCanonicalSlug.get(current)?.nextCanonicalSlug ?? null;
  }
  if (visited.size !== identities.length) throw new Error("Disconnected Abu Bakr lesson path");

  for (const identity of identities) {
    if (identity.nextCanonicalSlug !== null) {
      const nextIdentity = byCanonicalSlug.get(identity.nextCanonicalSlug);
      if (!nextIdentity || nextIdentity.displayNumber !== identity.displayNumber + 1) {
        throw new Error("Abu Bakr next lesson must advance exactly one display number");
      }
    }
  }
  if (terminals[0].displayNumber !== identities.length) throw new Error("Abu Bakr terminal lesson must have display number N");

  return [...identities].sort((left, right) => left.displayNumber - right.displayNumber);
}

/** The single learner-facing ordered projection. Source JSON order is never presentation order. */
export const ABU_BAKR_LESSON_IDENTITIES_IN_DISPLAY_ORDER = validateAbuBakrLessonIdentities(rawLessonIdentities);
export const ABU_BAKR_LESSON_COUNT = ABU_BAKR_LESSON_IDENTITIES_IN_DISPLAY_ORDER.length;

const ABU_BAKR_LESSONS_BY_CANONICAL_SLUG = new Map(
  ABU_BAKR_LESSON_IDENTITIES_IN_DISPLAY_ORDER.map((identity) => [identity.canonicalSlug, identity]),
);
const ABU_BAKR_LESSONS_BY_ROUTE_SLUG = new Map(
  ABU_BAKR_LESSON_IDENTITIES_IN_DISPLAY_ORDER.map((identity) => [identity.routeSlug, identity]),
);

export function getAbuBakrLessonByCanonicalSlug(slug: string): AbuBakrLessonIdentity | null {
  return ABU_BAKR_LESSONS_BY_CANONICAL_SLUG.get(slug) ?? null;
}

export function getAbuBakrLessonByRouteSlug(slug: string): AbuBakrLessonIdentity | null {
  return ABU_BAKR_LESSONS_BY_ROUTE_SLUG.get(slug) ?? null;
}

export function getNextAbuBakrLesson(identity: AbuBakrLessonIdentity): AbuBakrLessonIdentity | null {
  return identity.nextCanonicalSlug ? getAbuBakrLessonByCanonicalSlug(identity.nextCanonicalSlug) : null;
}
