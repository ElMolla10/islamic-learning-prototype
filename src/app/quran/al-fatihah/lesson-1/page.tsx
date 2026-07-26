import type { Metadata } from "next";
import { LessonExperience } from "@/components/LessonExperience";
import { getFatihahLesson } from "@/content/server";

export const metadata: Metadata = { title: "Why Surah al-Fatihah Is Unique" };

export default async function LessonPage(){const lesson=await getFatihahLesson();return <LessonExperience lesson={lesson}/>}
