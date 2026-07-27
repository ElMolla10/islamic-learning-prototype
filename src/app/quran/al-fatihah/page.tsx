"use client";

import { useEffect, useState } from "react";
import { PathLessonCard } from "@/components/Cards";
import { PathProgressPills, derivePathStatus } from "@/components/PathProgressPills";
import { useLanguage } from "@/components/LanguageProvider";
import { fatihahPath } from "@/content/catalogue";
import { LESSON_ID, parseProgress, PROGRESS_KEY } from "@/lib/progress";
import type { LessonProgressStatus } from "@/lib/sahabah-progress";

const FATIHAH_LESSON_COUNT = fatihahPath.length;
const SCOPE_LABEL = { ar: "مسار السورة", en: "Surah path" };
const UNIT_LABEL = { ar: "دروسٍ", en: "lessons" };

export default function FatihahPathPage() {
  const { language } = useLanguage();
  const [status, setStatus] = useState<LessonProgressStatus>("not_started");

  useEffect(() => {
    const update = () => {
      const progress = parseProgress(localStorage.getItem(PROGRESS_KEY));
      setStatus(progress.completedLessonIds.includes(LESSON_ID) ? "completed" : progress.lessonOpened ? "in_progress" : "not_started");
    };
    update();
    window.addEventListener("prototype-progress-reset", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("prototype-progress-reset", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  // Only Lesson 1 currently has real, navigable content, so it is the only lesson that can ever be
  // "completed" today; do not imply the whole 6-lesson Surah path is complete just because it is.
  const completedCount = status === "completed" ? 1 : 0;
  const pathStatus = derivePathStatus(completedCount, FATIHAH_LESSON_COUNT, status !== "not_started");

  return (
    <main>
      <section className="surah-hero">
        <div className="shell surah-hero-grid">
          <div>
            <span className="surah-index">01</span>
            <span className="eyebrow">{language === "ar" ? "مسار سورة" : "Surah path"}</span>
            <h1>{language === "ar" ? "سورة الفاتحة" : "Surah al-Fatihah"}</h1>
            <p>{language === "ar" ? "سبع آيات · يعدّها أكثر العلماء مكية" : "Seven verses · commonly classified as Makki"}</p>
            <PathProgressPills language={language} status={pathStatus} completedCount={completedCount} totalCount={FATIHAH_LESSON_COUNT} scopeLabel={SCOPE_LABEL} unitLabel={UNIT_LABEL} />
          </div>
          <blockquote>{language === "ar" ? "﴿الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ﴾" : "“All praise belongs to Allah, Lord of all worlds.”"}</blockquote>
        </div>
      </section>
      <div className="shell path-layout">
        <section>
          <div className="section-heading">
            <div>
              <span className="eyebrow">{language === "ar" ? "المسار الكامل" : "Learning path"}</span>
              <h2>{language === "ar" ? "من النظرة العامة إلى التفسير" : "From overview to tafsir"}</h2>
            </div>
          </div>
          <div className="path-list">
            {fatihahPath.map((lesson) => (
              <PathLessonCard lesson={lesson} progressStatus={lesson.state === "active" ? status : undefined} key={lesson.slug} />
            ))}
          </div>
        </section>
        <aside className="path-context">
          <span className="eyebrow">{language === "ar" ? "ما الذي ستتعلمه الآن؟" : "What will you learn now?"}</span>
          <h2>{language === "ar" ? "لماذا الفاتحة فريدة؟" : "Why is al-Fatihah unique?"}</h2>
          <p>{language === "ar" ? "مكانتها في القرآن والصلاة، وأسماؤها الأثبت، وحركة معانيها الكبرى. إكمال هذا الدرس لا يكمل مسار السورة كله." : "Its place in the Qur’an and Salah, its best-established names, and the movement of its major themes. Completing this lesson does not complete the whole Surah path."}</p>
        </aside>
      </div>
    </main>
  );
}
