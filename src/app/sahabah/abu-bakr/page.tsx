"use client";

import { useEffect, useState } from "react";
import { ChapterCard } from "@/components/sahabah/Cards";
import { useLanguage } from "@/components/LanguageProvider";
import { abuBakrPath } from "@/content/catalogue";
import { ABU_BAKR_LESSON_COUNT, readAbuBakrPathProgress, type LessonProgressStatus } from "@/lib/sahabah-progress";

export default function AbuBakrPathPage() {
  const { language } = useLanguage();
  const [statuses, setStatuses] = useState<LessonProgressStatus[]>(() => Array(ABU_BAKR_LESSON_COUNT).fill("not_started"));
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    const update = () => {
      const result = readAbuBakrPathProgress();
      setStatuses(result.statuses);
      setCompletedCount(result.completedCount);
    };
    update();
    window.addEventListener("prototype-progress-reset", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("prototype-progress-reset", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const pathStatus: LessonProgressStatus = completedCount >= ABU_BAKR_LESSON_COUNT ? "completed" : statuses.some((status) => status !== "not_started") ? "in_progress" : "not_started";
  const pathStatusText =
    language === "ar"
      ? { not_started: "لم يبدأ", in_progress: "قيد التقدم", completed: "اكتمل المسار" }[pathStatus]
      : { not_started: "Not started", in_progress: "In progress", completed: "Path complete" }[pathStatus];
  const countLabel =
    language === "ar"
      ? `${new Intl.NumberFormat("ar").format(completedCount)} من ${new Intl.NumberFormat("ar").format(ABU_BAKR_LESSON_COUNT)} فصولًا مكتملة`
      : `${completedCount} of ${ABU_BAKR_LESSON_COUNT} chapters complete`;

  return (
    <main>
      <section className="surah-hero bio-companion-hero">
        <div className="shell surah-hero-grid">
          <div>
            <span className="surah-index">01</span>
            <span className="eyebrow">{language === "ar" ? "مسار صحابي" : "Companion path"}</span>
            <h1>{language === "ar" ? "أبو بكر الصديق" : "Abu Bakr al-Siddiq"}</h1>
            <p>{language === "ar" ? "١١ فصلًا · الفصل الأول محتوًى حقيقيًا، والبقية بنية مبدئية قيد الإعداد" : "11 chapters · Chapter 1 has real content, the rest are draft structure in progress"}</p>
            <span className="path-status">{language === "ar" ? `حالة مسار السيرة: ${pathStatusText}` : `Biography path status: ${pathStatusText}`}</span>
            <span className="path-status path-progress-count" data-testid="path-progress-count">
              {countLabel}
            </span>
          </div>
          <blockquote>{language === "ar" ? "﴿اقتباس عنصر نائب — بانتظار المراجعة﴾" : "“Placeholder quotation — pending review”"}</blockquote>
        </div>
      </section>
      <div className="shell path-layout">
        <section>
          <div className="section-heading">
            <div>
              <span className="eyebrow">{language === "ar" ? "الفصول الكاملة" : "Full chapter list"}</span>
              <h2>{language === "ar" ? "من البدايات إلى القيادة" : "From beginnings to leadership"}</h2>
            </div>
          </div>
          <div className="path-list">
            {abuBakrPath.map((chapter) => (
              <ChapterCard chapter={chapter} progressStatus={chapter.state === "active" ? statuses[chapter.number - 1] : undefined} key={chapter.slug} />
            ))}
          </div>
        </section>
        <aside className="path-context">
          <span className="eyebrow">{language === "ar" ? "ما الذي ستتعلمه؟" : "What will you learn?"}</span>
          <h2>{language === "ar" ? "من كان أبو بكر الصدّيق؟" : "Who Was Abu Bakr al-Siddiq?"}</h2>
          <p>{language === "ar" ? "الفصل الأول محتوًى حقيقيًا موثّقًا بالأدلة، ولا يزال داخليًا وبانتظار المراجعة العلمية النهائية قبل أي نشر. بقية الفصول (٢–١١) لا تزال بنية مسار بمحتوى عنصر نائب بانتظار إعدادها." : "Chapter 1 has real, evidence-traced content — still internal and pending final scholarly review before any publication. Chapters 2–11 remain a path structure with placeholder content, pending preparation."}</p>
        </aside>
      </div>
    </main>
  );
}
