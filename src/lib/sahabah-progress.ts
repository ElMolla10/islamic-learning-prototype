import type { Language } from "@/content/types";

export const SAHABAH_FOCUS_KEY = "islamic-library-sahabah-focus-mode";

/** Number of lessons in the Abu Bakr path (website numbering — see src/content/abu_bakr/README.md). */
export const ABU_BAKR_LESSON_COUNT = 11;

/** Per-lesson progress storage key. Each lesson persists its own card position, quiz state, etc. independently. */
export function sahabahProgressKey(lessonNumber: number) {
  return `islamic-library-sahabah-abu-bakr-lesson-${lessonNumber}-progress`;
}

/** Per-lesson quiz storage key (used by QuizPlayer to remember in-progress answers). */
export function sahabahQuizKey(lessonNumber: number) {
  return `islamic-library-sahabah-abu-bakr-lesson-${lessonNumber}-quiz`;
}

/** Stable completion-tracking id for a given website lesson number. */
export function abuBakrLessonId(lessonNumber: number) {
  return `abu-bakr-lesson-${lessonNumber}`;
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
export function readAbuBakrPathProgress(lessonCount: number = ABU_BAKR_LESSON_COUNT): { statuses: LessonProgressStatus[]; completedCount: number } {
  const statuses: LessonProgressStatus[] = [];
  for (let lessonNumber = 1; lessonNumber <= lessonCount; lessonNumber += 1) {
    const raw = typeof window === "undefined" ? null : window.localStorage.getItem(sahabahProgressKey(lessonNumber));
    statuses.push(sahabahLessonStatus(parseSahabahProgress(raw)));
  }
  return { statuses, completedCount: statuses.filter((status) => status === "completed").length };
}
