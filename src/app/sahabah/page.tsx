"use client";

import { CompanionCard } from "@/components/sahabah/Cards";
import { useLanguage } from "@/components/LanguageProvider";
import { companions } from "@/content/catalogue";

export default function SahabahPage() {
  const { language } = useLanguage();
  return (
    <main>
      <section className="category-hero">
        <div className="shell narrow">
          <span className="eyebrow">{language === "ar" ? "مسار الصحابة" : "Sahabah path"}</span>
          <h1>{language === "ar" ? "تعرّف على حياتهم وسيرتهم من مصادرها" : "Learn their lives and biographies from their sources"}</h1>
          <p>{language === "ar" ? "يبدأ النموذج بأبي بكر الصديق: مقدمة قصيرة قبل الفصول التفصيلية." : "The prototype begins with Abu Bakr al-Siddiq: a short introduction before the detailed chapters."}</p>
        </div>
      </section>
      <div className="shell page-stack">
        <section>
          <div className="section-heading">
            <div>
              <span className="eyebrow">{language === "ar" ? "تصفّح الصحابة" : "Browse the Sahabah"}</span>
              <h2>{language === "ar" ? "ابدأ بأبي بكر الصديق" : "Begin with Abu Bakr al-Siddiq"}</h2>
            </div>
          </div>
          <div className="companion-grid">
            {companions.map((companion) => (
              <CompanionCard companion={companion} key={companion.slug} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
