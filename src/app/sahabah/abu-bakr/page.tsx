"use client";

import { useEffect, useState } from "react";
import { ChapterCard } from "@/components/sahabah/Cards";
import { PathProgressPills, derivePathStatus } from "@/components/PathProgressPills";
import { useLanguage } from "@/components/LanguageProvider";
import { abuBakrPath } from "@/content/catalogue";
import { ABU_BAKR_LESSON_COUNT, readAbuBakrPathProgress, type LessonProgressStatus } from "@/lib/sahabah-progress";

const SCOPE_LABEL = { ar: "مسار السيرة", en: "Biography path" };
const UNIT_LABEL = { ar: "فصولًا", en: "chapters" };

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

  const pathStatus = derivePathStatus(completedCount, ABU_BAKR_LESSON_COUNT, statuses.some((status) => status !== "not_started"));

  return (
    <main>
      <section className="surah-hero bio-companion-hero">
        <div className="shell surah-hero-grid">
          <div>
            <span className="surah-index">01</span>
            <span className="eyebrow">{language === "ar" ? "مسار صحابي" : "Companion path"}</span>
            <h1>{language === "ar" ? "أبو بكر الصديق" : "Abu Bakr al-Siddiq"}</h1>
            <p>{language === "ar" ? "١١ فصلًا · الفصلان الأول والثاني محتوًى حقيقيًا، والبقية بنية مبدئية قيد الإعداد" : "11 chapters · Chapters 1 and 2 have real content, the rest are draft structure in progress"}</p>
            <PathProgressPills language={language} status={pathStatus} completedCount={completedCount} totalCount={ABU_BAKR_LESSON_COUNT} scopeLabel={SCOPE_LABEL} unitLabel={UNIT_LABEL} />
          </div>
          <div className="path-hero-preview" data-testid="path-hero-preview">
            <span className="eyebrow">{language === "ar" ? "أول فصل متاح الآن" : "First chapter available now"}</span>
            <strong>{abuBakrPath[0].title[language]}</strong>
            <p>{abuBakrPath[0].description[language]}</p>
          </div>
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
          <p>{language === "ar" ? "الفصلان الأول والثاني محتوًى حقيقيًا موثّقًا بالأدلة، ولا يزالان داخليَّين وبانتظار المراجعة العلمية النهائية قبل أي نشر. بقية الفصول (٣–١١) لا تزال بنية مسار بمحتوى عنصر نائب بانتظار إعدادها." : "Chapters 1 and 2 have real, evidence-traced content — still internal and pending final scholarly review before any publication. Chapters 3–11 remain a path structure with placeholder content, pending preparation."}</p>
        </aside>
      </div>
    </main>
  );
}
