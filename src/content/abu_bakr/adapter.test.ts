import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { adaptBiographyLesson } from "./adapter";

function fixture(name: string) {
  const file = path.resolve(process.cwd(), "src/content/abu_bakr/lesson_01", name);
  return JSON.parse(readFileSync(file, "utf8"));
}

export function adaptedLesson1Fixture() {
  return adaptBiographyLesson({
    meta: { slug: "lesson-1", number: 1, personName: { ar: "أبو بكر الصديق", en: "Abu Bakr al-Siddiq" }, title: { ar: "من كان أبو بكر الصدّيق؟", en: "Who Was Abu Bakr al-Siddiq?" }, readingTime: { ar: "١٠–١٢ دقيقة", en: "10–12 minutes" }, contentReady: true },
    blocks: fixture("lesson_blocks.json"),
    quiz: fixture("quiz_questions.json"),
    sources: fixture("source_drawer.json"),
    glossary: fixture("glossary.json"),
  });
}

describe("Abu Bakr lesson 1 (v2, real content) adapter", () => {
  it("parses exactly the resolved v2 structure: 10 cards, 5 deep sections, 9 quiz questions, contentReady", () => {
    const lesson = adaptedLesson1Fixture();
    expect(lesson.contentReady).toBe(true);
    expect(lesson.blocks).toHaveLength(10);
    expect(lesson.blocks.flatMap((block) => block.deepSections)).toHaveLength(5);
    expect(lesson.quiz).toHaveLength(9);
    expect(lesson.quiz.every((question) => ["multiple_choice", "select_all", "ordering", "true_false", "matching", "scenario"].includes(question.type))).toBe(true);
    expect(lesson.quiz.every((question) => question.correctAnswer !== null && question.correctAnswer !== undefined)).toBe(true);
  });

  it("does not carry the removed AB05-DS1 deep section", () => {
    const lesson = adaptedLesson1Fixture();
    const deepKeys = lesson.blocks.flatMap((block) => block.deepSections.map((section) => section.key));
    expect(deepKeys).not.toContain("AB05-DS1");
    expect(deepKeys).toEqual(["AB03-DS1", "AB03-DS2", "AB04-DS1", "AB06-DS1", "AB07-DS1"]);
  });

  it("resolves every quiz review_card_id / review_deep_section_id to a real block/deep-section key", () => {
    const lesson = adaptedLesson1Fixture();
    const blockKeys = new Set(lesson.blocks.map((block) => block.key));
    const deepKeys = new Set(lesson.blocks.flatMap((block) => block.deepSections.map((section) => section.key)));
    for (const question of lesson.quiz) {
      expect(blockKeys.has(question.reviewCardKey), `review_card_id for ${question.key}`).toBe(true);
      if (question.reviewDeepSectionKey) expect(deepKeys.has(question.reviewDeepSectionKey), `review_deep_section_id for ${question.key}`).toBe(true);
    }
  });

  it("ABQ06 (block-7 review) reflects the rounded core wording and both preserved exact figures, without preferring either", () => {
    const lesson = adaptedLesson1Fixture();
    const abq06 = lesson.quiz.find((question) => question.reviewDeepSectionKey === "AB07-DS1")!;
    expect(abq06).toBeDefined();
    expect(abq06.prompt.en.toLowerCase()).toContain("about two years");
    expect(abq06.explanation.en).toContain("two years and a hundred days");
    expect(abq06.explanation.en).toContain("two years and four months less four nights");
    const ab07 = lesson.blocks.find((block) => block.key === abq06.reviewCardKey)!;
    expect(ab07.items.en.join(" ")).toContain("about two years");
    expect(ab07.items.en.join(" ")).not.toContain("about two years and a hundred days");
  });

  it("AB02's core identity card also uses the rounded figure, not the exact one", () => {
    const lesson = adaptedLesson1Fixture();
    const ab02 = lesson.blocks[1];
    expect(ab02.items.en.join(" ")).toContain("about two years, at around sixty-three");
    expect(ab02.items.en.join(" ")).not.toContain("a hundred days");
  });

  it("the weak cave-checking report and the weak prayer-leadership chain methodology are absent from all learner-facing text", () => {
    const lesson = adaptedLesson1Fixture();
    const allText = JSON.stringify(lesson);
    expect(allText).not.toMatch(/snake/i);
    expect(allText).not.toMatch(/al-Hudhali|الهذلي/);
    expect(allText).not.toMatch(/very weak|ضعيف جداً/);
    expect(allText).not.toMatch(/L1-SP31/);
  });

  it("the established prayer-leadership account remains present and unweakened", () => {
    const lesson = adaptedLesson1Fixture();
    const ab05 = lesson.blocks.find((block) => block.title.en === "The Closest Companion")!;
    expect(ab05.items.en.join(" ")).toContain("Command Abu Bakr to lead the people in prayer");
  });

  it("does not introduce unsupported precedence names (Khadijah / 'Ali as first-category holders) as project-verified facts", () => {
    const lesson = adaptedLesson1Fixture();
    const allText = JSON.stringify(lesson);
    expect(allText).not.toMatch(/Khadijah|خديجة/);
  });

  it("does not present the Isra' explanation of al-Siddiq as established or as disproven", () => {
    const lesson = adaptedLesson1Fixture();
    const allText = JSON.stringify(lesson).toLowerCase();
    expect(allText).toMatch(/al-isra|الإسراء/i);
    expect(allText).not.toMatch(/disprove|fabricat|definitively incorrect|زائف|مفبرك/i);
    const abq02 = lesson.quiz.find((question) => question.reviewDeepSectionKey === "AB03-DS2")!;
    expect(abq02.explanation.en?.toLowerCase()).toContain("not found");
  });

  it("every source resolves claims_supported from nested per-location data and never crashes on missing hadith_numbers", () => {
    const lesson = adaptedLesson1Fixture();
    expect(lesson.sources.length).toBeGreaterThan(0);
    for (const source of lesson.sources) expect(Array.isArray(source.hadithNumbers)).toBe(true);
    const siyar = lesson.sources.find((source) => source.title.includes("Siyar"))!;
    expect(siyar.supportLevel).toBe("primary_evidence");
  });

  it("never exposes internal file paths, reviewer/decision-workflow file names, or internal passage ids", () => {
    const serialized = JSON.stringify(adaptedLesson1Fixture());
    expect(serialized).not.toMatch(/\/Users\//);
    expect(serialized).not.toMatch(/claims\.json|sentence_traceability|reviewer_questions|decision_form|decision_application_report|human_review_packet/i);
    expect(serialized).not.toMatch(/internal_passage_ids|reused_from_master_index/);
  });
});
