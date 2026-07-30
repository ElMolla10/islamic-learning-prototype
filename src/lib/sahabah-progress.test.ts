import { describe, expect, it } from "vitest";
import { abuBakrLessonId, emptySahabahProgress, parseSahabahProgress, readAbuBakrPathProgress, sahabahLessonRequirementsMet, sahabahLessonStatus, sahabahProgressKey, sahabahProgressPercent, sahabahQuizKey } from "./sahabah-progress";

describe("sahabah-progress", () => {
  it("keys are resolved by canonical slug and retain their existing values", () => {
    const lesson1 = "abu_bakr.lesson_01_who_was_abu_bakr" as const;
    const lesson2 = "abu_bakr.lesson_02_first_days_of_islam" as const;
    expect(sahabahProgressKey(lesson1)).toBe("islamic-library-sahabah-abu-bakr-lesson-1-progress");
    expect(sahabahProgressKey(lesson1)).not.toBe(sahabahProgressKey(lesson2));
    expect(sahabahQuizKey(lesson1)).toBe("islamic-library-sahabah-abu-bakr-lesson-1-quiz");
    expect(sahabahQuizKey(lesson1)).not.toBe(sahabahQuizKey(lesson2));
    expect(abuBakrLessonId(lesson1)).toBe("abu-bakr-lesson-1");
  });

  it("discards stale (pre-migration) progress instead of reinterpreting it against new content", () => {
    // Simulates a returning user's stored progress from before lesson 1's placeholder (16 blocks) was
    // replaced by its real content (10 blocks) -- version 1 must be discarded, not migrated, since block
    // keys/counts changed and old visitedBlockIds could otherwise falsely satisfy the new requirements.
    const stalePlaceholderProgress = JSON.stringify({
      version: 1,
      lessonOpened: true,
      currentBlockId: "block-13",
      visitedBlockIds: Array.from({ length: 16 }, (_, i) => `block-${i + 1}`),
      expandedDeepSectionIds: [],
      quizAttempts: 1,
      bestQuizScore: 1,
      quizSubmitted: true,
      quizPassed: true,
      lessonCompleted: true,
      completedLessonIds: ["abu-bakr-lesson-1"],
      preferredLanguage: "ar",
      focusMode: false,
    });
    expect(parseSahabahProgress(stalePlaceholderProgress)).toEqual(emptySahabahProgress);
  });

  it("accepts current-version progress and clamps/validates its fields defensively", () => {
    const raw = JSON.stringify({ version: 2, lessonOpened: true, currentBlockId: "block-3", visitedBlockIds: ["block-1", "block-2", "block-3"], expandedDeepSectionIds: ["AB03-DS1"], quizAttempts: 2, bestQuizScore: 1.5, quizSubmitted: true, quizPassed: true, lessonCompleted: false, completedLessonIds: [], preferredLanguage: "en", focusMode: true });
    const parsed = parseSahabahProgress(raw);
    expect(parsed.version).toBe(2);
    expect(parsed.currentBlockId).toBe("block-3");
    expect(parsed.bestQuizScore).toBe(1); // clamped to [0,1]
    expect(parsed.focusMode).toBe(false); // always reset on parse, matching existing session-only focus behavior
  });

  it("restores existing Lesson 1 and Lesson 2 completion records without migration", () => {
    for (const [canonicalSlug, completedId] of [
      ["abu_bakr.lesson_01_who_was_abu_bakr", "abu-bakr-lesson-1"],
      ["abu_bakr.lesson_02_first_days_of_islam", "abu-bakr-lesson-2"],
    ] as const) {
      const stored = JSON.stringify({ ...emptySahabahProgress, lessonOpened: true, lessonCompleted: true, quizSubmitted: true, quizPassed: true, completedLessonIds: [completedId] });
      localStorage.setItem(sahabahProgressKey(canonicalSlug), stored);
      const restored = parseSahabahProgress(localStorage.getItem(sahabahProgressKey(canonicalSlug)));
      expect(restored.lessonCompleted).toBe(true);
      expect(restored.completedLessonIds).toContain(abuBakrLessonId(canonicalSlug));
    }
  });

  it("retains the existing quiz-storage aliases for both integrated lessons", () => {
    expect(sahabahQuizKey("abu_bakr.lesson_01_who_was_abu_bakr")).toBe("islamic-library-sahabah-abu-bakr-lesson-1-quiz");
    expect(sahabahQuizKey("abu_bakr.lesson_02_first_days_of_islam")).toBe("islamic-library-sahabah-abu-bakr-lesson-2-quiz");
  });

  it("aggregates path progress by canonical slug rather than array position", () => {
    localStorage.clear();
    localStorage.setItem(sahabahProgressKey("abu_bakr.lesson_02_first_days_of_islam"), JSON.stringify({ ...emptySahabahProgress, lessonOpened: true }));
    const result = readAbuBakrPathProgress();
    expect(result.statuses["abu_bakr.lesson_01_who_was_abu_bakr"]).toBe("not_started");
    expect(result.statuses["abu_bakr.lesson_02_first_days_of_islam"]).toBe("in_progress");
    expect(Object.keys(result.statuses)[0]).toBe("abu_bakr.lesson_01_who_was_abu_bakr");
    expect(Object.keys(result.statuses).at(-1)).toBe("abu_bakr.lesson_12_timeline_review");
  });

  it("returns emptySahabahProgress for null/invalid input", () => {
    expect(parseSahabahProgress(null)).toEqual(emptySahabahProgress);
    expect(parseSahabahProgress("not json")).toEqual(emptySahabahProgress);
  });

  it("lesson requirements: all required blocks visited AND quiz submitted AND passed", () => {
    const required = ["block-1", "block-2"];
    const base = { ...emptySahabahProgress, visitedBlockIds: ["block-1", "block-2"] };
    expect(sahabahLessonRequirementsMet(base, required)).toBe(false); // quiz not submitted yet
    expect(sahabahLessonRequirementsMet({ ...base, quizSubmitted: true, quizPassed: true }, required)).toBe(true);
    expect(sahabahLessonRequirementsMet({ ...base, quizSubmitted: true, quizPassed: false }, required)).toBe(false);
    expect(sahabahLessonRequirementsMet({ ...emptySahabahProgress, visitedBlockIds: ["block-1"], quizSubmitted: true, quizPassed: true }, required)).toBe(false); // block-2 not visited
  });

  it("status and percent helpers", () => {
    expect(sahabahLessonStatus(emptySahabahProgress)).toBe("not_started");
    expect(sahabahLessonStatus({ ...emptySahabahProgress, lessonOpened: true })).toBe("in_progress");
    expect(sahabahLessonStatus({ ...emptySahabahProgress, lessonOpened: true, lessonCompleted: true })).toBe("completed");
    expect(sahabahProgressPercent({ ...emptySahabahProgress, visitedBlockIds: ["block-1"] }, 10)).toBe(9);
    expect(sahabahProgressPercent({ ...emptySahabahProgress, visitedBlockIds: Array.from({ length: 10 }, (_, i) => `block-${i + 1}`), quizPassed: true }, 10)).toBe(100);
  });
});
