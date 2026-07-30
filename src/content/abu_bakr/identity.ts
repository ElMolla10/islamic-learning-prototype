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
    if (analytics !== null && (typeof analytics !== "string" || !PUBLIC_ANALYTICS_SLUGS.has(analytics as PublicLessonSlug))) {
      throw new Error("Invalid Abu Bakr public analytics slug");
    }
    const nextCanonicalSlug = record.next_canonical_slug;
    if (nextCanonicalSlug !== null && (typeof nextCanonicalSlug !== "string" || nextCanonicalSlug.length === 0)) throw new Error("Invalid Abu Bakr next canonical slug");
    const canonicalSlug = requiredString(record.canonical_slug, "canonical slug");
    if (!/^abu_bakr\.lesson_[a-z0-9_]+$/.test(canonicalSlug)) throw new Error("Invalid Abu Bakr canonical slug");
    return {
      canonicalSlug,
      displayNumber: Number(displayNumber),
      routeSlug: requiredString(record.public_route_slug, "route slug"),
      contentFolder: requiredString(record.public_content_folder, "content folder"),
      legacyProgressKey: requiredString(record.legacy_progress_key, "progress key"),
      legacyQuizKey: requiredString(record.legacy_quiz_key, "quiz key"),
      legacyCompletedLessonId: requiredString(record.legacy_completed_lesson_id, "completed lesson id"),
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
  return identities;
}

export const ABU_BAKR_LESSON_IDENTITIES = validateAbuBakrLessonIdentities(rawLessonIdentities);
export const ABU_BAKR_LESSON_COUNT = ABU_BAKR_LESSON_IDENTITIES.length;

export function getAbuBakrLessonByCanonicalSlug(slug: string): AbuBakrLessonIdentity | null {
  return ABU_BAKR_LESSON_IDENTITIES.find((identity) => identity.canonicalSlug === slug) ?? null;
}

export function getAbuBakrLessonByRouteSlug(slug: string): AbuBakrLessonIdentity | null {
  return ABU_BAKR_LESSON_IDENTITIES.find((identity) => identity.routeSlug === slug) ?? null;
}

export function getNextAbuBakrLesson(identity: AbuBakrLessonIdentity): AbuBakrLessonIdentity | null {
  return identity.nextCanonicalSlug ? getAbuBakrLessonByCanonicalSlug(identity.nextCanonicalSlug) : null;
}
