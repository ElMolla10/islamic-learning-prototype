import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { abuBakrPath } from "../catalogue";
import type { LessonBlockType } from "../types";
import { adaptBiographyLesson } from "./adapter";
import { getAbuBakrLessonByCanonicalSlug } from "./identity";
import { LanguageProvider } from "@/components/LanguageProvider";
import { BiographyExperience } from "@/components/sahabah/BiographyExperience";

const CANONICAL_SLUG = "abu_bakr.lesson_03_faith_under_persecution";
const CONTENT = path.resolve(process.cwd(), "src/content/abu_bakr/lesson_03");

function fixture(name: string) {
  return JSON.parse(readFileSync(path.join(CONTENT, name), "utf8"));
}

export function adaptedLesson3Fixture() {
  return adaptBiographyLesson({
    meta: {
      canonicalSlug: CANONICAL_SLUG,
      slug: "lesson-3",
      number: 3,
      personName: { ar: "أبو بكر الصديق", en: "Abu Bakr al-Siddiq" },
      title: { ar: "الإيمان تحت الاضطهاد", en: "Faith Under Persecution" },
      readingTime: { ar: "١٠–١٢ دقيقة", en: "10–12 minutes" },
      contentReady: true,
    },
    blocks: fixture("lesson_blocks.json"),
    quiz: fixture("quiz_questions.json"),
    sources: fixture("source_drawer.json"),
    glossary: fixture("glossary.json"),
  });
}

describe("Abu Bakr Lesson 3 v2 public package", () => {
  it("uses the unchanged canonical route and legacy persistence aliases with analytics disabled", () => {
    const identity = getAbuBakrLessonByCanonicalSlug(CANONICAL_SLUG)!;
    expect(identity.routeSlug).toBe("lesson-3");
    expect(identity.contentFolder).toBe("lesson_03");
    expect(identity.legacyProgressKey).toBe("islamic-library-sahabah-abu-bakr-lesson-3-progress");
    expect(identity.legacyQuizKey).toBe("islamic-library-sahabah-abu-bakr-lesson-3-quiz");
    expect(identity.legacyCompletedLessonId).toBe("abu-bakr-lesson-3");
    expect(identity.publicAnalyticsSlug).toBeNull();
  });

  it("makes Lesson 3 available in the existing display-ordered path", () => {
    const lesson3 = abuBakrPath.find((chapter) => chapter.canonicalSlug === CANONICAL_SLUG)!;
    expect(lesson3).toMatchObject({ slug: "lesson-3", number: 3, state: "active", contentReady: true });
    expect(abuBakrPath.slice(0, 5).map((chapter) => chapter.state)).toEqual(["active", "active", "active", "active", "active"]);
    expect(abuBakrPath.slice(5).every((chapter) => chapter.state === "planned")).toBe(true);
    expect(abuBakrPath.map((chapter) => chapter.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it("adapts nine cards, one deep section, six questions, four terms, and three approved works", () => {
    const lesson = adaptedLesson3Fixture();
    expect(lesson.contentReady).toBe(true);
    expect(lesson.blocks).toHaveLength(9);
    expect(lesson.blocks.flatMap((block) => block.deepSections)).toHaveLength(1);
    expect(lesson.blocks.flatMap((block) => block.deepSections)[0].key).toBe("L3-B04-D1");
    expect(lesson.quiz).toHaveLength(6);
    expect(lesson.glossary).toHaveLength(4);
    expect(lesson.sources).toHaveLength(3);
    expect(lesson.sources.flatMap((source) => source.locations)).toHaveLength(5);
  });

  it("contains the approved bilingual place name and no placeholder or deferred narrative", () => {
    const lesson = adaptedLesson3Fixture();
    const text = JSON.stringify(lesson);
    expect(text).toContain("Faith Under Persecution");
    expect(text).toContain("الإيمان تحت الاضطهاد");
    expect(text).toContain("Bark al-Ghimad");
    expect(text).toContain("برك الغماد");
    for (const forbidden of [
      "Barq al-Ghimad",
      "PLACEHOLDER",
      "placeholder_structure_only",
      "thirty-eight",
      "first khatib",
      "first public speaker",
      "Dar al-Arqam",
      "Umm al-Khayr",
      "L3-SP",
      "internal_passage_ids",
      "reviewer_questions",
      "/Users/",
    ]) {
      expect(text).not.toContain(forbidden);
    }
  });
});

describe("Lesson 3's three previously blank cards render through the generic renderer", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  async function goToCard(target: number) {
    const user = userEvent.setup();
    for (let i = 1; i < target; i += 1) {
      await user.click(screen.getByRole("button", { name: "التالي" }));
    }
  }

  it("registers representative_event, context_and_consequence, and event_consequence_meaning as valid LessonBlockType literals", () => {
    const types: LessonBlockType[] = ["representative_event", "context_and_consequence", "event_consequence_meaning"];
    expect(types).toHaveLength(3);
  });

  it("renders Card 4 (representative_event) with its Arabic content and an expandable deep section", async () => {
    const lesson = adaptedLesson3Fixture();
    expect(lesson.blocks[3].type).toBe("representative_event");
    render(createElement(LanguageProvider, null, createElement(BiographyExperience, { lesson })));
    await goToCard(4);
    expect(screen.getByRole("heading", { level: 2, name: lesson.blocks[3].title.ar })).toBeInTheDocument();
    const deepSections = screen.getByTestId("deep-sections");
    const details = deepSections.querySelector("details")!;
    expect(details.open).toBe(false);
    await userEvent.setup().click(deepSections.querySelector("summary")!);
    expect(details.open).toBe(true);
  });

  it("renders Card 6 (context_and_consequence) with its Arabic content", async () => {
    const lesson = adaptedLesson3Fixture();
    expect(lesson.blocks[5].type).toBe("context_and_consequence");
    render(createElement(LanguageProvider, null, createElement(BiographyExperience, { lesson })));
    await goToCard(6);
    expect(screen.getByRole("heading", { level: 2, name: lesson.blocks[5].title.ar })).toBeInTheDocument();
  });

  it("renders Card 7 (event_consequence_meaning) with its Arabic content", async () => {
    const lesson = adaptedLesson3Fixture();
    expect(lesson.blocks[6].type).toBe("event_consequence_meaning");
    render(createElement(LanguageProvider, null, createElement(BiographyExperience, { lesson })));
    await goToCard(7);
    expect(screen.getByRole("heading", { level: 2, name: lesson.blocks[6].title.ar })).toBeInTheDocument();
  });
});
