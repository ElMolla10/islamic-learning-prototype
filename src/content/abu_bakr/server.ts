import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { adaptBiographyLesson } from "./adapter";
import { abuBakrPath } from "@/content/catalogue";

/**
 * Website lesson number -> content folder name under src/content/abu_bakr/.
 * Numbering is sequential 1-11 except lesson 6, which merges two content_research lessons and therefore
 * gets a descriptive folder name instead of a bare lesson_06. See README.md in this directory for the
 * full mapping onto content_research/abu_bakr/ lesson folders (which has an offset after the merge).
 */
const CONTENT_FOLDERS: Record<number, string> = {
  1: "lesson_01",
  2: "lesson_02",
  3: "lesson_03",
  4: "lesson_04",
  5: "lesson_05",
  6: "lesson_06_final_illness_and_death",
  7: "lesson_07",
  8: "lesson_08",
  9: "lesson_09",
  10: "lesson_10",
  11: "lesson_11",
};

export const ABU_BAKR_LESSON_NUMBERS = Object.keys(CONTENT_FOLDERS).map(Number);

export function isValidAbuBakrLessonNumber(value: number): boolean {
  return Number.isInteger(value) && value in CONTENT_FOLDERS;
}

async function readJson(lessonNumber: number, name: string) {
  const folder = CONTENT_FOLDERS[lessonNumber];
  if (!folder) throw new Error(`No Abu Bakr content folder mapped for lesson ${lessonNumber}`);
  const source = path.resolve(process.cwd(), "src/content/abu_bakr", folder, name);
  return JSON.parse(await readFile(source, "utf8")) as unknown;
}

export async function getAbuBakrLesson(lessonNumber: number) {
  if (!isValidAbuBakrLessonNumber(lessonNumber)) return null;
  const chapter = abuBakrPath.find((entry) => entry.number === lessonNumber);
  if (!chapter) return null;

  const [blocks, quiz, sources, glossary] = await Promise.all([
    readJson(lessonNumber, "lesson_blocks.json"),
    readJson(lessonNumber, "quiz_questions.json"),
    readJson(lessonNumber, "source_drawer.json"),
    readJson(lessonNumber, "glossary.json"),
  ]);
  return adaptBiographyLesson({
    meta: {
      slug: chapter.slug,
      number: chapter.number,
      personName: { ar: "أبو بكر الصديق", en: "Abu Bakr al-Siddiq" },
      title: chapter.title,
      readingTime: { ar: "١٠–١٢ دقيقة", en: "10–12 minutes" },
      contentReady: chapter.contentReady ?? false,
    },
    blocks: blocks as Parameters<typeof adaptBiographyLesson>[0]["blocks"],
    quiz: quiz as Parameters<typeof adaptBiographyLesson>[0]["quiz"],
    sources: sources as Parameters<typeof adaptBiographyLesson>[0]["sources"],
    glossary: glossary as Parameters<typeof adaptBiographyLesson>[0]["glossary"],
  });
}
