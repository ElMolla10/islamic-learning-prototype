import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BiographyExperience } from "@/components/sahabah/BiographyExperience";
import { ABU_BAKR_LESSON_NUMBERS, getAbuBakrLesson, isValidAbuBakrLessonNumber } from "@/content/abu_bakr/server";
import { abuBakrPath } from "@/content/catalogue";

type Params = { lessonSlug: string };

// The URL shape is /sahabah/abu-bakr/lesson-<n> (no slash before the number, matching the original
// lesson-1 prototype route). App Router dynamic segments can't mix static text with brackets within a
// single folder name (a folder named "lesson-[n]" is NOT treated as a dynamic segment), so this route
// captures the whole "lesson-<n>" segment and parses it here instead.
function parseLessonNumber(slug: string): number | null {
  const match = /^lesson-(\d+)$/.exec(slug);
  if (!match) return null;
  return Number(match[1]);
}

export function generateStaticParams(): Params[] {
  return ABU_BAKR_LESSON_NUMBERS.map((n) => ({ lessonSlug: `lesson-${n}` }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lessonSlug } = await params;
  const lessonNumber = parseLessonNumber(lessonSlug);
  const chapter = lessonNumber ? abuBakrPath.find((entry) => entry.number === lessonNumber) : undefined;
  return { title: chapter ? chapter.title.en : "Abu Bakr al-Siddiq" };
}

export default async function AbuBakrLessonPage({ params }: { params: Promise<Params> }) {
  const { lessonSlug } = await params;
  const lessonNumber = parseLessonNumber(lessonSlug);
  if (lessonNumber === null || !isValidAbuBakrLessonNumber(lessonNumber)) notFound();

  const lesson = await getAbuBakrLesson(lessonNumber);
  if (!lesson) notFound();

  return <BiographyExperience lesson={lesson} />;
}
