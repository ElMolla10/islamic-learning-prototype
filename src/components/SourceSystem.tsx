"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Source } from "@/content/types";
import { useLanguage } from "./LanguageProvider";
import { CloseIcon, SourceIcon } from "./icons";

type SourceContextValue = { openSources: (keys?: string[], trigger?: HTMLElement) => void };
const SourceContext = createContext<SourceContextValue | null>(null);

export function SourceProvider({ sources, children }: { sources: Source[]; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [keys, setKeys] = useState<string[]>([]);
  const triggerRef = useRef<HTMLElement | null>(null);
  const value = useMemo(() => ({ openSources(nextKeys: string[] = [], trigger?: HTMLElement) { setKeys(nextKeys); triggerRef.current = trigger ?? null; setOpen(true); } }), []);
  return <SourceContext.Provider value={value}>{children}<SourceDrawer sources={sources} selectedKeys={keys} open={open} onClose={() => { setOpen(false); window.setTimeout(() => triggerRef.current?.focus(), 0); }} /></SourceContext.Provider>;
}

export function useSources() {
  const value = useContext(SourceContext);
  if (!value) throw new Error("useSources must be inside SourceProvider");
  return value;
}

export function SourceBadge({ sourceKeys, compact = false, label }: { sourceKeys: string[]; compact?: boolean; label?: string }) {
  const { language } = useLanguage();
  const { openSources } = useSources();
  if (!sourceKeys.length) return null;
  const visible = label ?? (language === "ar" ? (sourceKeys.length === 1 ? "المصدر" : `${sourceKeys.length} مصادر`) : (sourceKeys.length === 1 ? "Source" : `${sourceKeys.length} sources`));
  return <button type="button" className="source-badge" data-compact={compact} onClick={(event) => openSources(sourceKeys, event.currentTarget)} aria-label={language === "ar" ? `فتح المصادر الداعمة: ${visible}` : `Open supporting sources: ${visible}`}><SourceIcon />{visible}</button>;
}

export function AllSourcesButton({ count }: { count: number }) {
  const { language } = useLanguage(); const { openSources } = useSources();
  return <button className="secondary-button" type="button" onClick={(event) => openSources([], event.currentTarget)}><SourceIcon />{language === "ar" ? `عرض المصادر (${count})` : `View sources (${count})`}</button>;
}

function SourceDrawer({ sources, selectedKeys, open, onClose }: { sources: Source[]; selectedKeys: string[]; open: boolean; onClose: () => void }) {
  const { language } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null); const closeRef = useRef<HTMLButtonElement>(null);
  const visible = selectedKeys.length ? sources.filter((source) => selectedKeys.includes(source.key)) : sources;
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; closeRef.current?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter((element) => !element.hasAttribute("disabled"));
      if (!focusable.length) return;
      const first=focusable[0], last=focusable[focusable.length-1];
      if (event.shiftKey && document.activeElement===first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement===last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown",keydown);
    return () => { document.body.style.overflow=previousOverflow; document.removeEventListener("keydown",keydown); };
  }, [open,onClose]);
  if (!open) return null;
  return <div className="drawer-layer"><button type="button" className="drawer-backdrop" aria-label={language === "ar" ? "إغلاق المصادر" : "Close sources"} onClick={onClose}/><div className="source-drawer" role="dialog" aria-modal="true" aria-labelledby="source-drawer-title" ref={panelRef}>
    <header><div><span className="eyebrow">{language === "ar" ? "التوثيق" : "Evidence"}</span><h2 id="source-drawer-title">{language === "ar" ? "مصادر هذا الجزء" : "Sources for this section"}</h2></div><button ref={closeRef} className="icon-button" type="button" onClick={onClose} aria-label={language === "ar" ? "إغلاق درج المصادر" : "Close source drawer"}><CloseIcon /></button></header>
    <p className="drawer-intro">{language === "ar" ? "هذه بيانات موجزة تساعدك على معرفة أصل المعلومة دون قطع مسار القراءة." : "These concise details show where the lesson evidence comes from without interrupting the reading flow."}</p>
    <div className="source-list">{visible.map((source) => <article className="source-item" key={source.key}><div className="source-item-heading"><SourceIcon/><div><h3>{source.title}</h3><p>{source.author}</p></div></div><div className="role-list">{source.roles.map((role) => <span key={role}>{role}</span>)}</div><dl>{source.locations.map((location,index) => <div key={`${source.key}-${index}`}><dt>{language === "ar" ? "الموضع" : "Location"}</dt><dd>{location.volume ? (language === "ar" ? `المجلد ${location.volume}، ` : `Vol. ${location.volume}, `) : ""}{language === "ar" ? `صفحة PDF ${location.page}` : `PDF page ${location.page}`}{location.printedPage ? (language === "ar" ? `، المطبوعة ${location.printedPage}` : `, printed ${location.printedPage}`) : ""}</dd></div>)}{source.hadithNumbers.length>0 && <div><dt>{language === "ar" ? "رقم الحديث" : "Hadith number"}</dt><dd>{source.hadithNumbers.join("، ")}</dd></div>}</dl><p className="source-reason">{source.reason[language]}</p></article>)}</div>
  </div></div>;
}
