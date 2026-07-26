"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Language } from "@/content/types";

const STORAGE_KEY = "islamic-library-language";
type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void };
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("ar");
  const skipInitialPersist = useRef(true);
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // Hydrate the persisted preference only after the server-rendered Arabic shell mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "ar" || stored === "en") setLanguage(stored);
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    if (skipInitialPersist.current) {
      skipInitialPersist.current = false;
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);
  const value = useMemo(() => ({ language, setLanguage }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}

export function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="language-switch" role="group" aria-label={language === "ar" ? "تغيير اللغة" : "Change language"} data-compact={compact}>
      <button type="button" aria-pressed={language === "ar"} onClick={() => setLanguage("ar")}>ع</button>
      <button type="button" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>EN</button>
    </div>
  );
}
