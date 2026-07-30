"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "./LanguageProvider";
import { FOCUS_KEY, PROGRESS_KEY, QUIZ_KEY } from "@/lib/progress";
import { normalizePublicPath } from "@/lib/analytics";
import { FEEDBACK_CONTEXT_KEY } from "@/lib/feedback";
import { ResetIcon } from "./icons";

export function AppFooter() {
  const { language } = useLanguage();
  const pathname = usePathname();
  function reset() {
    window.localStorage.removeItem(PROGRESS_KEY);
    window.sessionStorage.removeItem(QUIZ_KEY);
    window.sessionStorage.removeItem(FOCUS_KEY);
    window.dispatchEvent(new Event("prototype-progress-reset"));
  }
  return (
    <footer className="app-footer">
      <div className="shell footer-row">
        <p>{language === "ar" ? "نسخة أولية داخلية خاصة — لا يوجد مزوّد تحليلات نشط ولا حسابات للمتعلمين." : "Private internal alpha — no active analytics provider and no learner accounts."}</p>
        <div className="footer-actions">
          <Link className="text-button" href="/feedback" onClick={() => sessionStorage.setItem(FEEDBACK_CONTEXT_KEY, normalizePublicPath(pathname) ?? "/")}>{language === "ar" ? "أرسل ملاحظة" : "Send feedback"}</Link>
          <button type="button" className="text-button" onClick={reset}><ResetIcon />{language === "ar" ? "إعادة ضبط تقدم النموذج" : "Reset prototype progress"}</button>
        </div>
      </div>
    </footer>
  );
}
