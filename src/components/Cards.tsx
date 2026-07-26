"use client";

import Link from "next/link";
import type { PathLesson, Subject, Surah } from "@/content/types";
import { useLanguage } from "./LanguageProvider";
import { ArrowIcon, BookIcon, CheckIcon } from "./icons";

export function SubjectCard({ subject }: { subject: Subject }) {
  const { language } = useLanguage();
  const content = <><span className="card-icon"><BookIcon /></span><strong>{subject.label[language]}</strong><span className="card-meta">{subject.active ? (language === "ar" ? "ابدأ المسار" : "Begin the path") : (language === "ar" ? "قريبًا" : "Coming later")}</span>{subject.active && <ArrowIcon className="card-arrow" />}</>;
  return subject.active ? <Link className="subject-card active" href="/quran">{content}</Link> : <article className="subject-card" data-disabled="true">{content}</article>;
}

export function ContinueLearningCard() {
  const { language } = useLanguage();
  return <Link href="/quran/al-fatihah/lesson-1" className="continue-card"><div><span className="eyebrow">{language === "ar" ? "تابع التعلّم" : "Continue learning"}</span><h2>{language === "ar" ? "لماذا سورة الفاتحة سورة فريدة؟" : "Why Surah al-Fatihah Is Unique"}</h2><p>{language === "ar" ? "الدرس الأول · ٥–٧ دقائق" : "Lesson 1 · 5–7 minutes"}</p></div><span className="continue-action">{language === "ar" ? "ابدأ" : "Start"}<ArrowIcon /></span></Link>;
}

export function SurahCard({ surah }: { surah: Surah }) {
  const { language } = useLanguage();
  const active = surah.availability === "active";
  const content = <><span className="surah-number">{surah.number}</span><div><h3>{surah.name[language]}</h3>{active ? <p>{language === "ar" ? `${surah.verses} آيات · مسار تمهيدي` : `${surah.verses} verses · Introductory path`}</p> : <p>{language === "ar" ? "عرض تخطيطي — غير متاح" : "Browse preview — unavailable"}</p>}</div>{active && <ArrowIcon className="card-arrow" />}</>;
  return active ? <Link href="/quran/al-fatihah" className="surah-card active">{content}</Link> : <article className="surah-card" data-disabled="true">{content}</article>;
}

export function PathLessonCard({ lesson }: { lesson: PathLesson }) {
  const { language } = useLanguage();
  const active = lesson.state === "active";
  const content = <><span className="path-number">{active ? <CheckIcon /> : lesson.number}</span><div><span className="eyebrow">{language === "ar" ? `الدرس ${lesson.number}` : `Lesson ${lesson.number}`}</span><h3>{lesson.title[language]}</h3><p>{active ? (language === "ar" ? "متاح الآن" : "Available now") : (language === "ar" ? "مخطط لاحقًا" : "Planned")}</p></div>{active && <ArrowIcon className="card-arrow" />}</>;
  return active ? <Link href="/quran/al-fatihah/lesson-1" className="path-card active">{content}</Link> : <article className="path-card" data-disabled="true">{content}</article>;
}
