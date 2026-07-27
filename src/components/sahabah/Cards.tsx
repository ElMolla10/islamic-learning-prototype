"use client";

import Link from "next/link";
import type { BiographyChapter, Companion } from "@/content/types";
import { useLanguage } from "@/components/LanguageProvider";
import { ArrowIcon, CheckIcon } from "@/components/icons";

export function CompanionCard({ companion }: { companion: Companion }) {
  const { language } = useLanguage();
  const active = companion.availability === "active";
  const content = (
    <>
      <span className="companion-initial">{companion.name[language].charAt(0)}</span>
      <div>
        <h3>{companion.name[language]}</h3>
        <p>{active ? companion.title[language] : language === "ar" ? "عرض تخطيطي — غير متاح" : "Browse preview — unavailable"}</p>
      </div>
      {active && <ArrowIcon className="card-arrow" />}
    </>
  );
  return active ? (
    <Link href="/sahabah/abu-bakr" className="companion-card active">
      {content}
    </Link>
  ) : (
    <article className="companion-card" data-disabled="true">
      {content}
    </article>
  );
}

export function ChapterCard({ chapter, progressStatus }: { chapter: BiographyChapter; progressStatus?: "not_started" | "in_progress" | "completed" }) {
  const { language } = useLanguage();
  const active = chapter.state === "active";
  const statusText = language === "ar" ? { not_started: "لم يبدأ", in_progress: "قيد التقدم", completed: "اكتمل الفصل" } : { not_started: "Not started", in_progress: "In progress", completed: "Chapter completed" };
  const inPreparation = language === "ar" ? "قيد الإعداد" : "In preparation";
  const content = (
    <>
      <span className="path-number">{active && progressStatus === "completed" ? <CheckIcon /> : chapter.number}</span>
      <div>
        <span className="eyebrow">{language === "ar" ? `الفصل ${chapter.number}` : `Chapter ${chapter.number}`}</span>
        <h3>{chapter.title[language]}</h3>
        <p className="path-card-description">{chapter.description[language]}</p>
        {active ? (
          <p className="path-card-status">{statusText[progressStatus ?? "not_started"]}</p>
        ) : (
          <span className="path-card-status-badge" data-state="in-preparation">
            {inPreparation}
          </span>
        )}
      </div>
      {active && <ArrowIcon className="card-arrow" />}
    </>
  );
  return active ? (
    <Link href={`/sahabah/abu-bakr/lesson-${chapter.number}`} className="path-card bio-chapter-card active">
      {content}
    </Link>
  ) : (
    <article className="path-card bio-chapter-card" data-disabled="true" aria-label={`${language === "ar" ? `الفصل ${chapter.number}` : `Chapter ${chapter.number}`} — ${chapter.title[language]} — ${inPreparation}`}>
      {content}
    </article>
  );
}
