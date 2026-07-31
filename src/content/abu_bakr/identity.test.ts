import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { abuBakrPath } from "@/content/catalogue";
import {
  ABU_BAKR_LESSON_IDENTITIES_IN_DISPLAY_ORDER,
  getAbuBakrLessonByCanonicalSlug,
  getAbuBakrLessonByRouteSlug,
  getNextAbuBakrLesson,
  validateAbuBakrLessonIdentities,
} from "./identity";

function rawIdentities() {
  return JSON.parse(readFileSync(path.resolve(process.cwd(), "src/content/abu_bakr/lesson_identity.json"), "utf8"));
}

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
    const lesson6 = getAbuBakrLessonByCanonicalSlug("abu_bakr.lesson_06_final_illness_and_death");
    expect(lesson6 && getNextAbuBakrLesson(lesson6)?.canonicalSlug).toBe("abu_bakr.lesson_08_the_first_caliph");
  });

  it("fails unknown canonical and route slugs safely", () => {
    expect(getAbuBakrLessonByCanonicalSlug("abu_bakr.lesson_unknown")).toBeNull();
    expect(getAbuBakrLessonByRouteSlug("lesson-99")).toBeNull();
  });

  it("rejects duplicate entries", () => {
    const raw = rawIdentities();
    raw[1].canonical_slug = raw[0].canonical_slug;
    expect(() => validateAbuBakrLessonIdentities(raw)).toThrow("Duplicate Abu Bakr identity canonicalSlug");
  });

  it("reversing source entries preserves learner-facing display order", () => {
    const raw = rawIdentities().reverse();
    const reversed = validateAbuBakrLessonIdentities(raw);
    expect(reversed.map((entry) => entry.displayNumber)).toEqual(Array.from({ length: 11 }, (_, index) => index + 1));
    expect(reversed[0]).toMatchObject({ routeSlug: "lesson-1", displayNumber: 1 });
    expect(reversed.at(-1)).toMatchObject({ routeSlug: "lesson-11", displayNumber: 11 });
    expect(abuBakrPath[0]).toMatchObject({ slug: "lesson-1", number: 1 });
    expect(abuBakrPath.at(-1)).toMatchObject({ slug: "lesson-11", number: 11 });
  });

  it("rejects cycles", () => {
    const raw = rawIdentities();
    raw.at(-1).next_canonical_slug = raw[0].canonical_slug;
    expect(() => validateAbuBakrLessonIdentities(raw)).toThrow("Cycle in Abu Bakr lesson path");
  });

  it("rejects disconnected subchains", () => {
    const raw = rawIdentities();
    raw[4].next_canonical_slug = null;
    expect(() => validateAbuBakrLessonIdentities(raw)).toThrow();
  });

  it("rejects multiple terminals", () => {
    const raw = rawIdentities();
    raw[1].next_canonical_slug = null;
    expect(() => validateAbuBakrLessonIdentities(raw)).toThrow();
  });

  it("rejects skipped and duplicate display numbers", () => {
    const skipped = rawIdentities();
    skipped.at(-1).website_display_number = 12;
    skipped.at(-1).public_route_slug = "lesson-12";
    skipped.at(-1).legacy_progress_key = "islamic-library-sahabah-abu-bakr-lesson-12-progress";
    skipped.at(-1).legacy_quiz_key = "islamic-library-sahabah-abu-bakr-lesson-12-quiz";
    skipped.at(-1).legacy_completed_lesson_id = "abu-bakr-lesson-12";
    expect(() => validateAbuBakrLessonIdentities(skipped)).toThrow("contiguous 1..N");

    const duplicate = rawIdentities();
    duplicate.at(-1).website_display_number = 10;
    duplicate.at(-1).public_route_slug = "lesson-10";
    duplicate.at(-1).legacy_progress_key = "islamic-library-sahabah-abu-bakr-lesson-10-progress";
    duplicate.at(-1).legacy_quiz_key = "islamic-library-sahabah-abu-bakr-lesson-10-quiz";
    duplicate.at(-1).legacy_completed_lesson_id = "abu-bakr-lesson-10";
    expect(() => validateAbuBakrLessonIdentities(duplicate)).toThrow("Duplicate Abu Bakr identity displayNumber");
  });

  it("rejects route/display mismatches, folder traversal, and malformed aliases", () => {
    const badRoute = rawIdentities();
    badRoute[0].public_route_slug = "lesson-2";
    expect(() => validateAbuBakrLessonIdentities(badRoute)).toThrow("route/display mismatch");

    const badFolder = rawIdentities();
    badFolder[0].public_content_folder = "../private";
    expect(() => validateAbuBakrLessonIdentities(badFolder)).toThrow("Unsafe Abu Bakr content folder");

    const badAlias = rawIdentities();
    badAlias[0].legacy_progress_key = "islamic-library-sahabah-abu-bakr-lesson-2-progress";
    expect(() => validateAbuBakrLessonIdentities(badAlias)).toThrow("progress alias/display mismatch");
  });

  it("keeps presentation entries collision-free and joined by canonical slug", () => {
    expect(new Set(abuBakrPath.map((chapter) => chapter.canonicalSlug)).size).toBe(ABU_BAKR_LESSON_IDENTITIES_IN_DISPLAY_ORDER.length);
    for (const identity of ABU_BAKR_LESSON_IDENTITIES_IN_DISPLAY_ORDER) {
      expect(abuBakrPath.find((chapter) => chapter.canonicalSlug === identity.canonicalSlug)).toMatchObject({ slug: identity.routeSlug, number: identity.displayNumber });
    }
  });

  it("matches every content file to its public canonical identity without private mapping fields", () => {
    for (const identity of ABU_BAKR_LESSON_IDENTITIES_IN_DISPLAY_ORDER) {
      for (const filename of ["lesson_blocks.json", "quiz_questions.json", "source_drawer.json", "glossary.json"]) {
        const payload = JSON.parse(readFileSync(path.resolve(process.cwd(), "src/content/abu_bakr", identity.contentFolder, filename), "utf8"));
        expect(payload.lesson_id).toBe(identity.canonicalSlug);
      }
    }
    const serialized = JSON.stringify(ABU_BAKR_LESSON_IDENTITIES_IN_DISPLAY_ORDER);
    expect(serialized).not.toContain("research_lesson_ids");
    expect(serialized).not.toContain("research_curriculum_positions");
  });
});
