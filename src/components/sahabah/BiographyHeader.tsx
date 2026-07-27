"use client";

import type { BiographyLesson, Language } from "@/content/types";

const placeholderTitles: Record<Language, string[]> = {
  ar: ["لقب عنصر نائب أول", "لقب عنصر نائب ثانٍ"],
  en: ["Placeholder title one", "Placeholder title two"],
};
const placeholderDates: Record<Language, string> = {
  ar: "تواريخ عنصر نائب — بانتظار المراجعة",
  en: "Placeholder dates — pending review",
};
const placeholderKunyah: Record<Language, string> = { ar: "كنية عنصر نائب", en: "Placeholder kunyah" };

export function BiographyHeader({ lesson, language }: { lesson: BiographyLesson; language: Language }) {
  return (
    <header className="bio-header">
      <div className="bio-header-copy">
        <span className="eyebrow">{language === "ar" ? "الصحابة" : "Sahabah"}</span>
        <h1>{lesson.personName[language]}</h1>
        {lesson.contentReady ? (
          <p className="bio-header-kunyah">{lesson.title[language]}</p>
        ) : (
          <>
            <p className="bio-header-kunyah">{placeholderKunyah[language]}</p>
            <div className="bio-header-titles">
              {placeholderTitles[language].map((title) => (
                <span key={title}>{title}</span>
              ))}
            </div>
            <p className="bio-header-dates">{placeholderDates[language]}</p>
          </>
        )}
      </div>
    </header>
  );
}
