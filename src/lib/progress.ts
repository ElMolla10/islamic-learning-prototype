import type { ProgressState } from "@/content/types";

export const PROGRESS_KEY = "islamic-library-prototype-progress";
export const QUIZ_KEY = "islamic-library-lesson-1-quiz";
export const emptyProgress: ProgressState = { lessonOpened: false, viewedBlocks: [], quizCompleted: false, lessonCompleted: false };

export function parseProgress(raw: string | null): ProgressState {
  if (!raw) return emptyProgress;
  try {
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      lessonOpened: Boolean(parsed.lessonOpened),
      viewedBlocks: Array.isArray(parsed.viewedBlocks) ? parsed.viewedBlocks.filter((value): value is string => typeof value === "string") : [],
      quizCompleted: Boolean(parsed.quizCompleted),
      lessonCompleted: Boolean(parsed.lessonCompleted),
    };
  } catch { return emptyProgress; }
}

export function progressPercent(progress: ProgressState, blockCount: number) {
  const viewed = Math.min(progress.viewedBlocks.length, blockCount);
  const completion = progress.lessonCompleted ? 1 : 0;
  return Math.round(((viewed + completion) / (blockCount + 1)) * 100);
}

export function answersMatch(selected: string[] | boolean | string, correct: string[] | boolean | null) {
  if (correct === null) return typeof selected === "string" && selected.trim().length > 0;
  if (typeof correct === "boolean") return selected === correct;
  if (!Array.isArray(selected)) return false;
  return selected.length === correct.length && selected.every((value, index) => value === correct[index]);
}
