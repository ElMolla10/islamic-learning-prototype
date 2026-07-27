import type { ProgressState } from "@/content/types";

export const PROGRESS_KEY = "islamic-library-prototype-progress";
export const QUIZ_KEY = "islamic-library-lesson-1-quiz";
export const FOCUS_KEY = "islamic-library-focus-mode";
export const LESSON_ID = "al-fatihah-lesson-1";
export const emptyProgress: ProgressState = {
  version: 3, lessonOpened: false, currentCardId: "card-1", visitedCardIds: [], expandedDeepSectionIds: [],
  quizAttempts: 0, bestQuizScore: 0, quizSubmitted: false, quizPassed: false, lessonCompleted: false,
  completedLessonIds: [], preferredLanguage: "ar", focusMode: false, lastVisitedAt: 0,
};

const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const migrateKey = (value: string) => value.replace(/^block-/, "card-");

export function parseProgress(raw: string | null): ProgressState {
  if (!raw) return emptyProgress;
  try {
    const parsed = JSON.parse(raw) as Partial<ProgressState> & { viewedBlocks?: unknown; quizCompleted?: boolean };
    const visited = strings(parsed.visitedCardIds).length ? strings(parsed.visitedCardIds) : strings(parsed.viewedBlocks).map(migrateKey);
    const current = typeof parsed.currentCardId === "string" ? migrateKey(parsed.currentCardId) : visited.at(-1) ?? "card-1";
    const isV3 = parsed.version === 3;
    return {
      version: 3,
      lessonOpened: Boolean(parsed.lessonOpened),
      currentCardId: current,
      visitedCardIds: [...new Set(visited.map(migrateKey))],
      expandedDeepSectionIds: strings(parsed.expandedDeepSectionIds),
      quizAttempts: Number.isFinite(parsed.quizAttempts) ? Math.max(0, Number(parsed.quizAttempts)) : 0,
      bestQuizScore: Number.isFinite(parsed.bestQuizScore) ? Math.min(1, Math.max(0, Number(parsed.bestQuizScore))) : 0,
      quizSubmitted: isV3 && Boolean(parsed.quizSubmitted),
      quizPassed: isV3 && Boolean(parsed.quizPassed),
      lessonCompleted: isV3 && Boolean(parsed.lessonCompleted),
      completedLessonIds: isV3 ? strings(parsed.completedLessonIds) : [],
      preferredLanguage: parsed.preferredLanguage === "en" ? "en" : "ar",
      focusMode: false,
      lastVisitedAt: Number.isFinite(parsed.lastVisitedAt) ? Number(parsed.lastVisitedAt) : 0,
    };
  } catch { return emptyProgress; }
}

export function progressPercent(progress: ProgressState, blockCount: number) {
  const visited = Math.min(progress.visitedCardIds.length, blockCount);
  if (blockCount > 0 && visited === blockCount && progress.quizPassed) return 100;
  return blockCount > 0 ? Math.min(99, Math.round((visited / blockCount) * 90)) : 0;
}

export function passesQuiz(score: number, total: number) { return total > 0 && score / total > 0.5; }

export function lessonRequirementsMet(progress: ProgressState, requiredCardIds: string[]) {
  return requiredCardIds.every((id) => progress.visitedCardIds.includes(id)) && progress.quizSubmitted && progress.quizPassed;
}

export function answersMatch(selected: string[] | boolean, correct: string[] | boolean, ordered = false) {
  if (typeof correct === "boolean") return selected === correct;
  if (!Array.isArray(selected)) return false;
  if (ordered) return selected.length === correct.length && selected.every((value, index) => value === correct[index]);
  return selected.length === correct.length && selected.every(value=>correct.includes(value));
}
