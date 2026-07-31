import type { Language } from "@/content/types";
import { ABU_BAKR_LESSON_IDENTITIES_IN_DISPLAY_ORDER, getAbuBakrLessonByCanonicalSlug, type AbuBakrCanonicalSlug } from "@/content/abu_bakr/identity";

export { ABU_BAKR_LESSON_COUNT } from "@/content/abu_bakr/identity";

export const SAHABAH_FOCUS_KEY = "islamic-library-sahabah-focus-mode";

function requireIdentity(canonicalSlug: AbuBakrCanonicalSlug) {
  const identity = getAbuBakrLessonByCanonicalSlug(canonicalSlug);
  if (!identity) throw new Error(`Unknown Abu Bakr canonical slug: ${canonicalSlug}`);
  return identity;
}

/** Explicit compatibility aliases: their number-bearing values remain unchanged for existing learners. */
export function sahabahProgressKey(canonicalSlug: AbuBakrCanonicalSlug) {
  return requireIdentity(canonicalSlug).legacyProgressKey;
}

export function sahabahQuizKey(canonicalSlug: AbuBakrCanonicalSlug) {
  return requireIdentity(canonicalSlug).legacyQuizKey;
}

export function abuBakrLessonId(canonicalSlug: AbuBakrCanonicalSlug) {
  return requireIdentity(canonicalSlug).legacyCompletedLessonId;
}

/**
 * version bumped 1 -> 2 when Lesson 1's placeholder content (16 blocks) was replaced by its real content
 * (10 blocks): a returning user's stale visitedBlockIds could otherwise appear to already satisfy the new,
 * shorter lesson's completion requirements without them ever reading it. Any stored progress at the old
 * version is discarded back to emptySahabahProgress (see parseSahabahProgress) rather than reinterpreted.
 */
export type SahabahProgressState = {
  version: 2;
  lessonOpened: boolean;
  currentBlockId: string;
  visitedBlockIds: string[];
  expandedDeepSectionIds: string[];
  quizAttempts: number;
  bestQuizScore: number;
  quizSubmitted: boolean;
  quizPassed: boolean;
  lessonCompleted: boolean;
  completedLessonIds: string[];
  preferredLanguage: Language;
  focusMode: boolean;
  /** Epoch ms of the most recent time this chapter was opened. 0 for progress saved before this field existed. */
  lastVisitedAt: number;
};

export const emptySahabahProgress: SahabahProgressState = {
  version: 2,
  lessonOpened: false,
  currentBlockId: "block-1",
  visitedBlockIds: [],
  expandedDeepSectionIds: [],
  quizAttempts: 0,
  bestQuizScore: 0,
  quizSubmitted: false,
  quizPassed: false,
  lessonCompleted: false,
  completedLessonIds: [],
  preferredLanguage: "ar",
  focusMode: false,
  lastVisitedAt: 0,
};

const strings = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);

export function parseSahabahProgress(raw: string | null): SahabahProgressState {
  if (!raw) return emptySahabahProgress;
  try {
    const parsed = JSON.parse(raw) as Partial<SahabahProgressState>;
    if (parsed.version !== 2) return emptySahabahProgress;
    return {
      version: 2,
      lessonOpened: Boolean(parsed.lessonOpened),
      currentBlockId: typeof parsed.currentBlockId === "string" ? parsed.currentBlockId : "block-1",
      visitedBlockIds: [...new Set(strings(parsed.visitedBlockIds))],
      expandedDeepSectionIds: strings(parsed.expandedDeepSectionIds),
      quizAttempts: Number.isFinite(parsed.quizAttempts) ? Math.max(0, Number(parsed.quizAttempts)) : 0,
      bestQuizScore: Number.isFinite(parsed.bestQuizScore) ? Math.min(1, Math.max(0, Number(parsed.bestQuizScore))) : 0,
      quizSubmitted: Boolean(parsed.quizSubmitted),
      quizPassed: Boolean(parsed.quizPassed),
      lessonCompleted: Boolean(parsed.lessonCompleted),
      completedLessonIds: strings(parsed.completedLessonIds),
      preferredLanguage: parsed.preferredLanguage === "en" ? "en" : "ar",
      focusMode: false,
      lastVisitedAt: Number.isFinite(parsed.lastVisitedAt) ? Number(parsed.lastVisitedAt) : 0,
    };
  } catch {
    return emptySahabahProgress;
  }
}

export function sahabahProgressPercent(progress: SahabahProgressState, blockCount: number) {
  const visited = Math.min(progress.visitedBlockIds.length, blockCount);
  if (blockCount > 0 && visited === blockCount && progress.quizPassed) return 100;
  return blockCount > 0 ? Math.min(99, Math.round((visited / blockCount) * 90)) : 0;
}

export function sahabahLessonRequirementsMet(progress: SahabahProgressState, requiredBlockIds: string[]) {
  return requiredBlockIds.every((id) => progress.visitedBlockIds.includes(id)) && progress.quizSubmitted && progress.quizPassed;
}

export type LessonProgressStatus = "not_started" | "in_progress" | "completed";

export function sahabahLessonStatus(progress: SahabahProgressState): LessonProgressStatus {
  if (progress.lessonCompleted) return "completed";
  if (progress.lessonOpened) return "in_progress";
  return "not_started";
}

/**
 * Path-level progress: reads each lesson's independent progress key from localStorage and reports its
 * status plus how many of the path's lessons are complete. Client-only (guards for a missing `window`
 * so it can be called defensively, though callers should still only invoke this inside an effect).
 */
export function readAbuBakrPathProgress(): { statuses: Record<AbuBakrCanonicalSlug, LessonProgressStatus>; completedCount: number } {
  const statuses = Object.fromEntries(ABU_BAKR_LESSON_IDENTITIES_IN_DISPLAY_ORDER.map((identity) => {
    const raw = typeof window === "undefined" ? null : window.localStorage.getItem(identity.legacyProgressKey);
    return [identity.canonicalSlug, sahabahLessonStatus(parseSahabahProgress(raw))];
  })) as Record<AbuBakrCanonicalSlug, LessonProgressStatus>;
  return { statuses, completedCount: Object.values(statuses).filter((status) => status === "completed").length };
}
