"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LanguageSwitch, useLanguage } from "./LanguageProvider";
import { BookIcon, MenuIcon } from "./icons";

export function AppHeader() {
  const { language } = useLanguage();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const labels = language === "ar"
    ? { identity: "منارات", home: "الرئيسية", quran: "القرآن", sahabah: "الصحابة", menu: "فتح القائمة" }
    : { identity: "Manārāt", home: "Home", quran: "Qur’an", sahabah: "Sahabah", menu: "Open menu" };
  const navItems = [
    { href: "/", label: labels.home, active: pathname === "/" },
    { href: "/quran", label: labels.quran, active: pathname === "/quran" || pathname.startsWith("/quran/") },
    { href: "/sahabah", label: labels.sahabah, active: pathname === "/sahabah" || pathname.startsWith("/sahabah/") },
  ];
  return (
    <>
      <aside className="development-banner" aria-label={language === "ar" ? "حالة النموذج" : "Prototype status"}>{language === "ar" ? "نموذج داخلي — المحتوى الديني يحتاج إلى اعتماد قبل النشر" : "Internal prototype — religious content requires approval before publication"}</aside>
      <header className="app-header">
        <div className="shell header-row">
          <Link href="/" className="identity" aria-label={labels.home}>
            <span className="identity-mark"><BookIcon /></span>
            <span>{labels.identity}<small>{language === "ar" ? "تعلّمٌ متأنٍّ من المصادر" : "Thoughtful learning from sources"}</small></span>
          </Link>
          <nav className="desktop-nav" aria-label={language === "ar" ? "التنقل الرئيسي" : "Primary navigation"}>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} aria-current={item.active ? "page" : undefined}>{item.label}</Link>
            ))}
          </nav>
          <div className="header-actions">
            <LanguageSwitch compact />
            <button className="icon-button mobile-menu-button" type="button" aria-label={labels.menu} aria-expanded={open} onClick={() => setOpen(!open)}><MenuIcon /></button>
          </div>
        </div>
        {open && (
          <nav className="mobile-nav" aria-label={language === "ar" ? "التنقل الرئيسي" : "Primary navigation"}>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} aria-current={item.active ? "page" : undefined} onClick={() => setOpen(false)}>{item.label}</Link>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
