import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { adaptLesson } from "./adapter";

async function readJson(name: string) {
  const source = path.resolve(process.cwd(), "../../content_drafts/al_fatihah/lesson_01_uniqueness_v2", name);
  return JSON.parse(await readFile(source, "utf8")) as unknown;
}

export async function getFatihahLesson() {
  const [blocks, quiz, sources, glossary] = await Promise.all([
    readJson("lesson_blocks.json"),
    readJson("quiz_questions.json"),
    readJson("source_drawer.json"),
    readJson("glossary.json"),
  ]);
  return adaptLesson({ blocks, quiz, sources, glossary } as Parameters<typeof adaptLesson>[0]);
}
