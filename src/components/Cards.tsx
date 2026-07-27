"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PathLesson, Subject, Surah } from "@/content/types";
import { getContinueRecommendation, type ContinueRecommendation } from "@/lib/continue-learning";
import { useLanguage } from "./LanguageProvider";
import { ArrowIcon, BookIcon, CheckIcon } from "./icons";

export function SubjectCard({ subject }: { subject: Subject }) {
  const { language } = useLanguage();
  const content = <><span className="card-icon"><BookIcon /></span><strong>{subject.label[language]}</strong><span className="card-meta">{subject.active ? (language === "ar" ? "ابدأ المسار" : "Begin the path") : (language === "ar" ? "قريبًا" : "Coming later")}</span>{subject.active && <ArrowIcon className="card-arrow" />}</>;
  return subject.active ? <Link className="subject-card active" href={`/${subject.slug}`}>{content}</Link> : <article className="subject-card" data-disabled="true">{content}</article>;
}

export function ContinueLearningCard() {
  const { language } = useLanguage();
  // Starts unset (rather than a hardcoded guess) so the server-rendered/pre-hydration markup never shows
  // a recommendation that might not match the learner's real, localStorage-only progress; it fills in
  // right after mount instead of ever showing a misleading "continue" state for the wrong lesson.
  const [recommendation, setRecommendation] = useState<ContinueRecommendation | null>(null);
  useEffect(() => {
    const update = () => setRecommendation(getContinueRecommendation());
    update();
    window.addEventListener("prototype-progress-reset", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("prototype-progress-reset", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  if (!recommendation) return null;
  return (
    <Link href={recommendation.route} className="continue-card" data-mode={recommendation.mode}>
      <div>
        <span className="eyebrow">{recommendation.category[language]}</span>
        <h2>{recommendation.title[language]}</h2>
        <p>{recommendation.subtitle[language]}</p>
      </div>
      <span className="continue-action">
        {recommendation.actionLabel[language]}
        <ArrowIcon />
      </span>
    </Link>
  );
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
