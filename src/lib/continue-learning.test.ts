import { beforeEach, describe, expect, it } from "vitest";
import { getContinueRecommendation } from "./continue-learning";
import { LESSON_ID, PROGRESS_KEY } from "./progress";
import { sahabahProgressKey } from "./sahabah-progress";

const ABU_BAKR_LESSON_1_KEY = sahabahProgressKey(1);

function fatihahProgress(overrides: Partial<{ lessonOpened: boolean; completedLessonIds: string[]; lastVisitedAt: number }>) {
  return JSON.stringify({
    version: 3, lessonOpened: false, currentCardId: "card-1", visitedCardIds: [], expandedDeepSectionIds: [],
    quizAttempts: 0, bestQuizScore: 0, quizSubmitted: false, quizPassed: false, lessonCompleted: false,
    completedLessonIds: [], preferredLanguage: "ar", focusMode: false, lastVisitedAt: 0,
    ...overrides,
  });
}

function abuBakrProgress(overrides: Partial<{ lessonOpened: boolean; lessonCompleted: boolean; lastVisitedAt: number }>) {
  return JSON.stringify({
    version: 2, lessonOpened: false, currentBlockId: "block-1", visitedBlockIds: [], expandedDeepSectionIds: [],
    quizAttempts: 0, bestQuizScore: 0, quizSubmitted: false, quizPassed: false, lessonCompleted: false,
    completedLessonIds: [], preferredLanguage: "ar", focusMode: false, lastVisitedAt: 0,
    ...overrides,
  });
}

describe("continue-learning selection", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("brand-new learner gets an intentional 'start' default, not a fake 'continue' state", () => {
    const rec = getContinueRecommendation();
    expect(rec.mode).toBe("start");
    expect(rec.actionLabel.ar).toBe("ابدأ التعلّم");
    expect(rec.actionLabel.en).toBe("Start learning");
  });

  it("promotes Al-Fatihah when only Al-Fatihah is in progress", () => {
    localStorage.setItem(PROGRESS_KEY, fatihahProgress({ lessonOpened: true, lastVisitedAt: 1000 }));
    const rec = getContinueRecommendation();
    expect(rec.mode).toBe("continue");
    expect(rec.route).toBe("/quran/al-fatihah/lesson-1");
  });

  it("promotes Abu Bakr when only Abu Bakr is in progress", () => {
    localStorage.setItem(ABU_BAKR_LESSON_1_KEY, abuBakrProgress({ lessonOpened: true, lastVisitedAt: 1000 }));
    const rec = getContinueRecommendation();
    expect(rec.mode).toBe("continue");
    expect(rec.route).toBe("/sahabah/abu-bakr/lesson-1");
  });

  it("when both are in progress, promotes whichever was most recently visited", () => {
    localStorage.setItem(PROGRESS_KEY, fatihahProgress({ lessonOpened: true, lastVisitedAt: 1000 }));
    localStorage.setItem(ABU_BAKR_LESSON_1_KEY, abuBakrProgress({ lessonOpened: true, lastVisitedAt: 5000 }));
    const rec = getContinueRecommendation();
    expect(rec.route).toBe("/sahabah/abu-bakr/lesson-1");

    localStorage.setItem(ABU_BAKR_LESSON_1_KEY, abuBakrProgress({ lessonOpened: true, lastVisitedAt: 500 }));
    const rec2 = getContinueRecommendation();
    expect(rec2.route).toBe("/quran/al-fatihah/lesson-1");
  });

  it("promotes the in-progress lesson over a completed one", () => {
    localStorage.setItem(PROGRESS_KEY, fatihahProgress({ completedLessonIds: [LESSON_ID], lessonOpened: true, lastVisitedAt: 100 }));
    localStorage.setItem(ABU_BAKR_LESSON_1_KEY, abuBakrProgress({ lessonOpened: true, lastVisitedAt: 200 }));
    const rec = getContinueRecommendation();
    expect(rec.mode).toBe("continue");
    expect(rec.route).toBe("/sahabah/abu-bakr/lesson-1");
  });

  it("offers a review state when everything started is complete and nothing new is available to start", () => {
    localStorage.setItem(PROGRESS_KEY, fatihahProgress({ completedLessonIds: [LESSON_ID], lessonOpened: true, lastVisitedAt: 100 }));
    localStorage.setItem(ABU_BAKR_LESSON_1_KEY, abuBakrProgress({ lessonCompleted: true, lessonOpened: true, lastVisitedAt: 200 }));
    const rec = getContinueRecommendation();
    expect(rec.mode).toBe("review");
    expect(rec.actionLabel.ar).toBe("راجع الدرس");
    expect(rec.route).toBe("/sahabah/abu-bakr/lesson-1"); // most recently completed
  });

  it("Arabic and English copy are both present and distinct per mode", () => {
    localStorage.setItem(PROGRESS_KEY, fatihahProgress({ lessonOpened: true, lastVisitedAt: 1000 }));
    const rec = getContinueRecommendation();
    expect(rec.actionLabel.ar).not.toBe(rec.actionLabel.en);
    expect(rec.category.ar).toBe("القرآن");
    expect(rec.category.en).toBe("Qur’an");
  });
});
