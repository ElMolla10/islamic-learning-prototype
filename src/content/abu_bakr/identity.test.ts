import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { abuBakrPath } from "@/content/catalogue";
import {
  ABU_BAKR_LESSON_IDENTITIES,
  getAbuBakrLessonByCanonicalSlug,
  getAbuBakrLessonByRouteSlug,
  validateAbuBakrLessonIdentities,
} from "./identity";

describe("Abu Bakr canonical lesson identity", () => {
  it("resolves Lessons 1 and 2 through canonical slugs while preserving routes and display numbers", () => {
    const lesson1 = getAbuBakrLessonByCanonicalSlug("abu_bakr.lesson_01_who_was_abu_bakr");
    const lesson2 = getAbuBakrLessonByCanonicalSlug("abu_bakr.lesson_02_first_days_of_islam");
    expect(lesson1).toMatchObject({ routeSlug: "lesson-1", displayNumber: 1 });
    expect(lesson2).toMatchObject({ routeSlug: "lesson-2", displayNumber: 2 });
    expect(getAbuBakrLessonByRouteSlug("lesson-1")?.canonicalSlug).toBe(lesson1?.canonicalSlug);
    expect(getAbuBakrLessonByRouteSlug("lesson-2")?.canonicalSlug).toBe(lesson2?.canonicalSlug);
  });

  it("keeps the later positional-offset case explicit", () => {
    expect(getAbuBakrLessonByRouteSlug("lesson-7")?.canonicalSlug).toBe("abu_bakr.lesson_08_the_first_caliph");
    expect(getAbuBakrLessonByCanonicalSlug("abu_bakr.lesson_08_the_first_caliph")?.displayNumber).toBe(7);
    expect(getAbuBakrLessonByCanonicalSlug("abu_bakr.lesson_06_final_illness_and_death")?.nextCanonicalSlug).toBe("abu_bakr.lesson_08_the_first_caliph");
  });

  it("fails unknown canonical and route slugs safely", () => {
    expect(getAbuBakrLessonByCanonicalSlug("abu_bakr.lesson_unknown")).toBeNull();
    expect(getAbuBakrLessonByRouteSlug("lesson-99")).toBeNull();
  });

  it("rejects duplicate entries", () => {
    const raw = JSON.parse(readFileSync(path.resolve(process.cwd(), "src/content/abu_bakr/lesson_identity.json"), "utf8"));
    raw[1].canonical_slug = raw[0].canonical_slug;
    expect(() => validateAbuBakrLessonIdentities(raw)).toThrow("Duplicate Abu Bakr identity canonicalSlug");
  });

  it("does not use array position as identity", () => {
    const raw = JSON.parse(readFileSync(path.resolve(process.cwd(), "src/content/abu_bakr/lesson_identity.json"), "utf8")).reverse();
    const reversed = validateAbuBakrLessonIdentities(raw);
    expect(reversed.find((entry) => entry.canonicalSlug === "abu_bakr.lesson_03_faith_under_persecution")).toMatchObject({ routeSlug: "lesson-3", displayNumber: 3 });
  });

  it("keeps presentation entries collision-free and joined by canonical slug", () => {
    expect(new Set(abuBakrPath.map((chapter) => chapter.canonicalSlug)).size).toBe(ABU_BAKR_LESSON_IDENTITIES.length);
    for (const identity of ABU_BAKR_LESSON_IDENTITIES) {
      expect(abuBakrPath.find((chapter) => chapter.canonicalSlug === identity.canonicalSlug)).toMatchObject({ slug: identity.routeSlug, number: identity.displayNumber });
    }
  });

  it("matches every content file to its public canonical identity without private mapping fields", () => {
    for (const identity of ABU_BAKR_LESSON_IDENTITIES) {
      for (const filename of ["lesson_blocks.json", "quiz_questions.json", "source_drawer.json", "glossary.json"]) {
        const payload = JSON.parse(readFileSync(path.resolve(process.cwd(), "src/content/abu_bakr", identity.contentFolder, filename), "utf8"));
        expect(payload.lesson_id).toBe(identity.canonicalSlug);
      }
    }
    const serialized = JSON.stringify(ABU_BAKR_LESSON_IDENTITIES);
    expect(serialized).not.toContain("research_lesson_ids");
    expect(serialized).not.toContain("research_curriculum_positions");
  });
});
