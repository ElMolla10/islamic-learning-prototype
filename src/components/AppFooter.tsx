"use client";

import { useLanguage } from "./LanguageProvider";
import { FOCUS_KEY, PROGRESS_KEY, QUIZ_KEY } from "@/lib/progress";
import { ResetIcon } from "./icons";

export function AppFooter() {
  const { language } = useLanguage();
  function reset() {
    window.localStorage.removeItem(PROGRESS_KEY);
    window.sessionStorage.removeItem(QUIZ_KEY);
    window.sessionStorage.removeItem(FOCUS_KEY);
    window.dispatchEvent(new Event("prototype-progress-reset"));
  }
  return (
    <footer className="app-footer">
      <div className="shell footer-row">
        <p>{language === "ar" ? "نموذج خاص للاختبار المحلي — بلا تحليلات أو حسابات." : "Private local prototype — no analytics or accounts."}</p>
        <button type="button" className="text-button" onClick={reset}><ResetIcon />{language === "ar" ? "إعادة ضبط تقدم النموذج" : "Reset prototype progress"}</button>
      </div>
    </footer>
  );
}
