import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { adaptedFixture } from "@/content/adapter.test";
import { adaptBiographyLesson } from "@/content/abu_bakr/adapter";
import { emptyProgress, PROGRESS_KEY } from "@/lib/progress";
import { emptySahabahProgress, sahabahProgressKey } from "@/lib/sahabah-progress";
import { setAnalyticsProviderForTests, type AnalyticsEvent } from "@/lib/analytics";
import { LanguageProvider, LanguageSwitch } from "./LanguageProvider";
import { LessonExperience } from "./LessonExperience";
import { QuizPlayer } from "./QuizPlayer";
import { AllSourcesButton, SourceBadge, SourceProvider } from "./SourceSystem";
import { BiographyExperience } from "./sahabah/BiographyExperience";

function adaptedLesson1Fixture() {
  const fixture = (name: string) => JSON.parse(readFileSync(path.resolve(process.cwd(), "src/content/abu_bakr/lesson_01", name), "utf8"));
  return adaptBiographyLesson({
    meta: {
      canonicalSlug: "abu_bakr.lesson_01_who_was_abu_bakr",
      slug: "lesson-1",
      number: 1,
      personName: { ar: "أبو بكر الصديق", en: "Abu Bakr al-Siddiq" },
      title: { ar: "من كان أبو بكر الصدّيق؟", en: "Who Was Abu Bakr al-Siddiq?" },
      readingTime: { ar: "١٠–١٢ دقيقة", en: "10–12 minutes" },
      contentReady: true,
    },
    blocks: fixture("lesson_blocks.json"),
    quiz: fixture("quiz_questions.json"),
    sources: fixture("source_drawer.json"),
    glossary: fixture("glossary.json"),
  });
}

describe("approved analytics emission points", () => {
  const events: AnalyticsEvent[] = [];

  beforeEach(() => {
    events.length = 0;
    localStorage.clear();
    sessionStorage.clear();
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
    setAnalyticsProviderForTests({ track: (event) => { events.push(event); } });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    setAnalyticsProviderForTests(null);
  });

  it("emits lesson_start once on a first opening, not on rerender", async () => {
    const lesson = adaptedFixture();
    const view = render(<LanguageProvider><LessonExperience lesson={lesson} /></LanguageProvider>);
    await waitFor(() => expect(events.filter((event) => event.name === "lesson_start")).toHaveLength(1));
    view.rerender(<LanguageProvider><LessonExperience lesson={lesson} /></LanguageProvider>);
    await waitFor(() => expect(events.filter((event) => event.name === "lesson_start")).toHaveLength(1));
    expect(events[0]).toEqual({ name: "lesson_start", properties: { lesson_slug: "al-fatihah-lesson-1", language: "ar" } });
  });

  it("does not emit lifecycle events for restored opened or completed lessons", async () => {
    const lesson = adaptedFixture();
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({
      ...emptyProgress,
      lessonOpened: true,
      lessonCompleted: true,
      currentCardId: lesson.blocks.at(-1)!.key,
      visitedCardIds: lesson.blocks.map((block) => block.key),
      lastVisitedAt: Date.now(),
    }));
    const view = render(<LanguageProvider><LessonExperience lesson={lesson} /></LanguageProvider>);
    await waitFor(() => expect(screen.getByTestId("lesson-completed")).toBeVisible());
    view.rerender(<LanguageProvider><LessonExperience lesson={lesson} /></LanguageProvider>);
    expect(events.filter((event) => event.name === "lesson_start" || event.name === "lesson_complete")).toEqual([]);
  });

  it("emits only aggregate quiz_submit data and one lesson_complete transition", async () => {
    const original = adaptedFixture();
    const lesson = { ...original, quiz: [original.quiz[0]] };
    const requiredCardIds = lesson.blocks.filter((block) => block.requiredForCompletion).map((block) => block.key);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({
      ...emptyProgress,
      lessonOpened: true,
      currentCardId: lesson.blocks.at(-1)!.key,
      visitedCardIds: requiredCardIds,
      lastVisitedAt: Date.now(),
    }));

    const view = render(<LanguageProvider><LessonExperience lesson={lesson} /></LanguageProvider>);
    await userEvent.click(await screen.findByLabelText("أعظم سورة في القرآن"));
    await userEvent.click(screen.getByRole("button", { name: "تحقق من الإجابة" }));

    await waitFor(() => expect(events.some((event) => event.name === "lesson_complete")).toBe(true));
    expect(events.filter((event) => event.name === "quiz_submit")).toEqual([{
      name: "quiz_submit",
      properties: { lesson_slug: "al-fatihah-lesson-1", language: "ar", correct: 1, total: 1 },
    }]);
    expect(events.filter((event) => event.name === "lesson_complete")).toEqual([{
      name: "lesson_complete",
      properties: { lesson_slug: "al-fatihah-lesson-1", language: "ar" },
    }]);
    view.rerender(<LanguageProvider><LessonExperience lesson={lesson} /></LanguageProvider>);
    await waitFor(() => expect(events.filter((event) => event.name === "lesson_complete")).toHaveLength(1));
  });

  it("maps Abu Bakr lessons 1 and 2 to their exact public analytics slugs", async () => {
    const lesson1 = adaptedLesson1Fixture();
    const first = render(<LanguageProvider><BiographyExperience lesson={lesson1} /></LanguageProvider>);
    await waitFor(() => expect(events.filter((event) => event.name === "lesson_start")).toEqual([{
      name: "lesson_start",
      properties: { lesson_slug: "abu-bakr-lesson-1", language: "ar" },
    }]));
    first.unmount();

    events.length = 0;
    const lesson2 = { ...lesson1, canonicalSlug: "abu_bakr.lesson_02_first_days_of_islam" as const, number: 2, slug: "lesson-2" };
    render(<LanguageProvider><BiographyExperience lesson={lesson2} /></LanguageProvider>);
    await waitFor(() => expect(events.filter((event) => event.name === "lesson_start")).toEqual([{
      name: "lesson_start",
      properties: { lesson_slug: "abu-bakr-lesson-2", language: "ar" },
    }]));
  });

  it("does not re-emit biography lifecycle events from restored completed state", async () => {
    const lesson = adaptedLesson1Fixture();
    localStorage.setItem(sahabahProgressKey(lesson.canonicalSlug), JSON.stringify({
      ...emptySahabahProgress,
      lessonOpened: true,
      lessonCompleted: true,
      currentBlockId: lesson.blocks.at(-1)!.key,
      visitedBlockIds: lesson.blocks.map((block) => block.key),
      completedLessonIds: ["abu-bakr-lesson-1"],
      lastVisitedAt: Date.now(),
    }));
    const view = render(<LanguageProvider><BiographyExperience lesson={lesson} /></LanguageProvider>);
    await waitFor(() => expect(screen.getByTestId("lesson-completed")).toBeVisible());
    view.rerender(<LanguageProvider><BiographyExperience lesson={lesson} /></LanguageProvider>);
    expect(events.filter((event) => event.name === "lesson_start" || event.name === "lesson_complete")).toEqual([]);
  });

  it("emits one safe drawer context per explicit source opening", async () => {
    const lesson = adaptedFixture();
    render(
      <LanguageProvider>
        <SourceProvider sources={lesson.sources} analyticsContext={{ lessonSlug: "al-fatihah-lesson-1", cardIndex: 2, cardCount: 10 }}>
          <SourceBadge sourceKeys={[lesson.sources[0].key]} />
        </SourceProvider>
      </LanguageProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: /فتح المصادر الداعمة/ }));
    expect(events).toEqual([{
      name: "source_drawer_open",
      properties: { lesson_slug: "al-fatihah-lesson-1", language: "ar", source_context: "section_sources", card_index: 2, card_count: 10 },
    }]);
  });

  it("emits all_sources without card metadata", async () => {
    const lesson = adaptedFixture();
    render(
      <LanguageProvider>
        <SourceProvider sources={lesson.sources} analyticsContext={{ lessonSlug: "al-fatihah-lesson-1", cardIndex: 2, cardCount: 10 }}>
          <AllSourcesButton count={lesson.sources.length} />
        </SourceProvider>
      </LanguageProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: /عرض المصادر/ }));
    expect(events).toEqual([{
      name: "source_drawer_open",
      properties: { lesson_slug: "al-fatihah-lesson-1", language: "ar", source_context: "all_sources" },
    }]);
    expect(events[0].properties).not.toHaveProperty("card_index");
    expect(events[0].properties).not.toHaveProperty("card_count");
  });

  it("emits one aggregate quiz event per completed attempt, including a deliberate retry", async () => {
    const question = adaptedFixture().quiz.find((item) => item.type === "multiple_choice")!;
    const correctIds = (Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer]).map(String);
    const wrong = question.options.find((option) => !correctIds.includes(option.id))!;
    const view = render(
      <QuizPlayer
        questions={[question]}
        language="en"
        onAttempt={() => undefined}
        onReview={() => undefined}
        analyticsLessonSlug="al-fatihah-lesson-1"
      />,
    );

    await userEvent.click(await screen.findByLabelText(wrong.label.en));
    await userEvent.click(screen.getByRole("button", { name: "Check answer" }));
    expect(events.filter((event) => event.name === "quiz_submit")).toEqual([{
      name: "quiz_submit",
      properties: { lesson_slug: "al-fatihah-lesson-1", language: "en", correct: 0, total: 1 },
    }]);
    view.rerender(
      <QuizPlayer questions={[question]} language="en" onAttempt={() => undefined} onReview={() => undefined} analyticsLessonSlug="al-fatihah-lesson-1" />,
    );
    expect(events.filter((event) => event.name === "quiz_submit")).toHaveLength(1);

    await userEvent.click(screen.getByRole("button", { name: "Retry quiz" }));
    await userEvent.click(await screen.findByLabelText(wrong.label.en));
    await userEvent.click(screen.getByRole("button", { name: "Check answer" }));
    const submissions = events.filter((event) => event.name === "quiz_submit");
    expect(submissions).toHaveLength(2);
    expect(submissions[1]).toEqual({
      name: "quiz_submit",
      properties: { lesson_slug: "al-fatihah-lesson-1", language: "en", correct: 0, total: 1 },
    });
    expect(JSON.stringify(submissions)).not.toContain(question.prompt.en);
    expect(JSON.stringify(submissions)).not.toContain(wrong.label.en);
    expect(Object.keys(submissions[1].properties).sort()).toEqual(["correct", "language", "lesson_slug", "total"]);
  });

  it("emits language_switch only when the language actually changes", async () => {
    render(<LanguageProvider><LanguageSwitch /></LanguageProvider>);
    await userEvent.click(screen.getByRole("button", { name: "EN" }));
    await userEvent.click(screen.getByRole("button", { name: "EN" }));
    expect(events).toEqual([{
      name: "language_switch",
      properties: { public_path: "/", previous_language: "ar", next_language: "en" },
    }]);
  });
});
