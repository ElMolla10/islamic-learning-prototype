import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BiographyExperience } from "@/components/sahabah/BiographyExperience";
import { ABU_BAKR_LESSON_ROUTE_SLUGS, getAbuBakrLesson } from "@/content/abu_bakr/server";
import { getAbuBakrLessonByRouteSlug } from "@/content/abu_bakr/identity";
import { abuBakrPath } from "@/content/catalogue";

type Params = { lessonSlug: string };

export function generateStaticParams(): Params[] {
  return ABU_BAKR_LESSON_ROUTE_SLUGS.map((lessonSlug) => ({ lessonSlug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lessonSlug } = await params;
  const identity = getAbuBakrLessonByRouteSlug(lessonSlug);
  const chapter = identity ? abuBakrPath.find((entry) => entry.canonicalSlug === identity.canonicalSlug) : undefined;
  return { title: chapter ? chapter.title.en : "Abu Bakr al-Siddiq" };
}

export default async function AbuBakrLessonPage({ params }: { params: Promise<Params> }) {
  const { lessonSlug } = await params;
  const lesson = await getAbuBakrLesson(lessonSlug);
  if (!lesson) notFound();

  return <BiographyExperience lesson={lesson} />;
}
