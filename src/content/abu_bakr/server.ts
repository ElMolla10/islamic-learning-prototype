import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { adaptBiographyLesson } from "./adapter";
import { ABU_BAKR_LESSON_IDENTITIES_IN_DISPLAY_ORDER, getAbuBakrLessonByRouteSlug, type AbuBakrLessonIdentity } from "./identity";
import { abuBakrPath } from "@/content/catalogue";

export const ABU_BAKR_LESSON_ROUTE_SLUGS = ABU_BAKR_LESSON_IDENTITIES_IN_DISPLAY_ORDER.map((identity) => identity.routeSlug);

async function readJson(identity: AbuBakrLessonIdentity, name: string) {
  const source = path.resolve(process.cwd(), "src/content/abu_bakr", identity.contentFolder, name);
  const payload = JSON.parse(await readFile(source, "utf8")) as unknown;
  if (!payload || typeof payload !== "object" || (payload as { lesson_id?: unknown }).lesson_id !== identity.canonicalSlug) {
    throw new Error(`Abu Bakr content identity mismatch for ${identity.canonicalSlug} in ${name}`);
  }
  return payload;
}

export async function getAbuBakrLesson(routeSlug: string) {
  const identity = getAbuBakrLessonByRouteSlug(routeSlug);
  if (!identity) return null;
  const chapter = abuBakrPath.find((entry) => entry.canonicalSlug === identity.canonicalSlug);
  if (!chapter) return null;

  const [blocks, quiz, sources, glossary] = await Promise.all([
    readJson(identity, "lesson_blocks.json"),
    readJson(identity, "quiz_questions.json"),
    readJson(identity, "source_drawer.json"),
    readJson(identity, "glossary.json"),
  ]);
  return adaptBiographyLesson({
    meta: {
      canonicalSlug: identity.canonicalSlug,
      slug: identity.routeSlug,
      number: identity.displayNumber,
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
