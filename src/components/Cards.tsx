"use client";

import Link from "next/link";
import type { PathLesson, Subject, Surah } from "@/content/types";
import { useLanguage } from "./LanguageProvider";
import { ArrowIcon, BookIcon, CheckIcon } from "./icons";

export function SubjectCard({ subject }: { subject: Subject }) {
  const { language } = useLanguage();
  const content = <><span className="card-icon"><BookIcon /></span><strong>{subject.label[language]}</strong><span className="card-meta">{subject.active ? (language === "ar" ? "ابدأ المسار" : "Begin the path") : (language === "ar" ? "قريبًا" : "Coming later")}</span>{subject.active && <ArrowIcon className="card-arrow" />}</>;
  return subject.active ? <Link className="subject-card active" href={`/${subject.slug}`}>{content}</Link> : <article className="subject-card" data-disabled="true">{content}</article>;
}

export function ContinueLearningCard() {
  const { language } = useLanguage();
  return <Link href="/quran/al-fatihah/lesson-1" className="continue-card"><div><span className="eyebrow">{language === "ar" ? "تابع التعلّم" : "Continue learning"}</span><h2>{language === "ar" ? "لماذا سورة الفاتحة سورة فريدة؟" : "Why Surah al-Fatihah Is Unique"}</h2><p>{language === "ar" ? "الدرس الأول · ٦–٨ دقائق للفكرة الأساسية" : "Lesson 1 · 6–8 minute core"}</p></div><span className="continue-action">{language === "ar" ? "ابدأ" : "Start"}<ArrowIcon /></span></Link>;
}

export function SurahCard({ surah }: { surah: Surah }) {
  const { language } = useLanguage();
  const active = surah.availability === "active";
  const content = <><span className="surah-number">{surah.number}</span><div><h3>{surah.name[language]}</h3>{active ? <p>{language === "ar" ? `${surah.verses} آيات · مسار تمهيدي` : `${surah.verses} verses · Introductory path`}</p> : <p>{language === "ar" ? "عرض تخطيطي — غير متاح" : "Browse preview — unavailable"}</p>}</div>{active && <ArrowIcon className="card-arrow" />}</>;
  return active ? <Link href="/quran/al-fatihah" className="surah-card active">{content}</Link> : <article className="surah-card" data-disabled="true">{content}</article>;
}

export function PathLessonCard({ lesson, progressStatus }: { lesson: PathLesson; progressStatus?: "not_started"|"in_progress"|"completed" }) {
  const { language } = useLanguage();
  const active = lesson.state === "active";
  const statusText=language==="ar"?{not_started:"لم يبدأ",in_progress:"قيد التقدم",completed:"اكتمل الدرس"}:{not_started:"Not started",in_progress:"In progress",completed:"Lesson completed"};
  const content = <><span className="path-number">{active&&progressStatus==="completed" ? <CheckIcon /> : lesson.number}</span><div><span className="eyebrow">{language === "ar" ? `الدرس ${lesson.number}` : `Lesson ${lesson.number}`}</span><h3>{lesson.title[language]}</h3><p>{active ? statusText[progressStatus??"not_started"] : (language === "ar" ? "مخطط لاحقًا" : "Planned")}</p></div>{active && <ArrowIcon className="card-arrow" />}</>;
  return active ? <Link href="/quran/al-fatihah/lesson-1" className="path-card active">{content}</Link> : <article className="path-card" data-disabled="true">{content}</article>;
}
