import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { adaptLesson } from "./adapter";

function fixture(name: string) {
  const file = path.resolve(process.cwd(), "../../content_drafts/al_fatihah/lesson_01_uniqueness_v2", name);
  return JSON.parse(readFileSync(file, "utf8"));
}

export function adaptedFixture() {
  return adaptLesson({ blocks: fixture("lesson_blocks.json"), quiz: fixture("quiz_questions.json"), sources: fixture("source_drawer.json"), glossary: fixture("glossary.json") });
}

describe("Draft 2 content adapter", () => {
  it("parses all learner blocks, quiz questions, and sources", () => {
    const lesson = adaptedFixture();
    expect(lesson.blocks).toHaveLength(10);
    expect(lesson.quiz).toHaveLength(7);
    expect(lesson.sources).toHaveLength(10);
    expect(lesson.blocks[5].items.ar[1]).toContain("قسمت الصلاة");
  });

  it("never exposes internal paths, OCR, hashes, or claim identifiers", () => {
    const serialized = JSON.stringify(adaptedFixture());
    expect(serialized).not.toMatch(/\/Users\//);
    expect(serialized).not.toMatch(/CLM\d+/);
    expect(serialized).not.toMatch(/pdf_[a-f0-9]+/);
    expect(serialized).not.toMatch(/organized_paths|reviewer_status|inspection|sha256|OCR/i);
  });
});
