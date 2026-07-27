"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Language, Source } from "@/content/types";
import { compactNumberRanges, groupSourceLocations } from "@/lib/source-display";
import { useLanguage } from "./LanguageProvider";
import { CloseIcon, SourceIcon } from "./icons";

type SourceContextValue={openSources:(keys?:string[],trigger?:HTMLElement)=>void};
const SourceContext=createContext<SourceContextValue|null>(null);

export function SourceProvider({sources,children}:{sources:Source[];children:ReactNode}){
  const [open,setOpen]=useState(false);const [keys,setKeys]=useState<string[]>([]);const triggerRef=useRef<HTMLElement|null>(null);
  const value=useMemo(()=>({openSources(nextKeys:string[]=[],trigger?:HTMLElement){setKeys(nextKeys);triggerRef.current=trigger??null;setOpen(true);}}),[]);
  return <SourceContext.Provider value={value}>{children}{open&&<SourceDrawer sources={sources} selectedKeys={keys} onClose={()=>{setOpen(false);window.setTimeout(()=>triggerRef.current?.focus(),0);}}/>}</SourceContext.Provider>;
}

export function useSources(){const value=useContext(SourceContext);if(!value)throw new Error("useSources must be inside SourceProvider");return value;}

export function SourceBadge({sourceKeys,compact=false,label}:{sourceKeys:string[];compact?:boolean;label?:string}){
  const {language}=useLanguage();const {openSources}=useSources();if(!sourceKeys.length)return null;
  const visible=label??(language==="ar"?(sourceKeys.length===1?"المصدر":`${sourceKeys.length} مصادر`):(sourceKeys.length===1?"Source":`${sourceKeys.length} sources`));
  return <button type="button" className="source-badge" data-compact={compact} onClick={event=>openSources(sourceKeys,event.currentTarget)} aria-label={language==="ar"?`فتح المصادر الداعمة: ${visible}`:`Open supporting sources: ${visible}`}><SourceIcon/>{visible}</button>;
}

export function AllSourcesButton({count}:{count:number}){const {language}=useLanguage();const {openSources}=useSources();return <button className="secondary-button" type="button" onClick={event=>openSources([],event.currentTarget)}><SourceIcon/>{language==="ar"?`عرض المصادر (${count})`:`View sources (${count})`}</button>;}

const roleLabels:Record<string,Record<Language,string>>={
  revelation_quran:{ar:"القرآن الكريم / المصدر الأصلي",en:"Qur’an / primary source"},
  early_tafsir:{ar:"تفسير بالمأثور",en:"Transmitted tafsir"},
  later_tafsir:{ar:"تفسير",en:"Tafsir"},
  analytical_tafsir:{ar:"تفسير تحليلي",en:"Analytical tafsir"},
  accessible_tafsir:{ar:"تفسير ميسر",en:"Accessible tafsir"},
  quranic_vocabulary_reference:{ar:"معجم قرآني",en:"Qur’anic vocabulary"},
  primary_hadith_collection:{ar:"حديث صحيح / مصدر أصلي",en:"Authentic hadith / primary source"},
  hadith_commentary:{ar:"شرح حديث",en:"Hadith commentary"},
  primary_hadith_collection_with_commentary:{ar:"حديث مع شرحه",en:"Hadith with commentary"},
  dedicated_biography:{ar:"سيرة مخصصة",en:"Dedicated biography"},
  early_narrative_history:{ar:"سيرة روائية مبكرة",en:"Early narrative history"},
  later_historical_synthesis:{ar:"توليف تاريخي لاحق",en:"Later historical synthesis"},
};
const supportLabels:Record<Source["supportLevel"],Record<Language,string>>={
  primary_evidence:{ar:"دليل أصلي",en:"Primary evidence"},direct_commentary:{ar:"شرح مباشر",en:"Direct commentary"},supporting_tafsir:{ar:"تفسير داعم",en:"Supporting tafsir"},broader_comparative_support:{ar:"دعم مقارن أوسع",en:"Broader comparative support"},
};
const priority:Record<Source["supportLevel"],number>={primary_evidence:0,direct_commentary:1,supporting_tafsir:2,broader_comparative_support:3};

function SourceCard({source,language}:{source:Source;language:Language}){
  const groups=groupSourceLocations(source.locations);const hasAuthor=Boolean(source.author.trim()&&source.author.trim()!=="—");
  const hasTechnical=groups.some(group=>group.hasDifferentPdfMapping);
  return <details className="source-item"><summary><span className="source-item-heading"><SourceIcon/><span><strong>{source.title}</strong>{hasAuthor&&<small>{source.author}</small>}</span></span><span className="role-list"><i>{supportLabels[source.supportLevel][language]}</i>{source.roleCodes.map(role=><i key={role}>{roleLabels[role]?.[language]??(language==="ar"?"مرجع داعم":"Supporting reference")}</i>)}</span><span className="source-reason">{source.reason[language]}</span></summary><div className="source-expanded">
    <p className="source-locations-heading">{language==="ar"?"المواضع المستخدمة":"Referenced locations"}</p>
    {source.scriptureReferences.length>0?<div className="scripture-references">{source.scriptureReferences.map((reference,index)=><span key={index}>{reference[language]}</span>)}</div>:<div className="grouped-locations">{groups.map((group,index)=><p key={index}>{group.volume?(language==="ar"?`الجزء ${group.volume} — `:`Vol. ${group.volume} — `):""}{language==="ar"?"الصفحات المطبوعة":"Printed pages"}: {compactNumberRanges(group.printedPages.length?group.printedPages:group.pdfPages,language==="ar"?"، ":", ")}</p>)}</div>}
    {source.hadithNumbers.length>0&&<p className="hadith-reference"><b>{language==="ar"?"أرقام الأحاديث":"Hadith numbers"}:</b> {source.hadithNumbers.join(language==="ar"?"، ":", ")}</p>}
    {hasTechnical&&<details className="technical-details"><summary>{language==="ar"?"تفاصيل النسخة المصورة":"Scanned-edition details"}</summary><div>{groups.filter(group=>group.hasDifferentPdfMapping).flatMap(group=>group.mappings.filter(mapping=>mapping.printed!==undefined&&mapping.printed!==mapping.pdf).map(mapping=><span key={`${group.volume??"none"}-${mapping.pdf}`}>{group.volume?(language==="ar"?`ج ${group.volume}، `:`v.${group.volume}, `):""}{language==="ar"?`المطبوعة ${mapping.printed} ← PDF ${mapping.pdf}`:`printed ${mapping.printed} ← PDF ${mapping.pdf}`}</span>))}</div></details>}
  </div></details>;
}

function SourceDrawer({sources,selectedKeys,onClose}:{sources:Source[];selectedKeys:string[];onClose:()=>void}){
  const {language}=useLanguage();const [showAll,setShowAll]=useState(false);const panelRef=useRef<HTMLDivElement>(null);const closeRef=useRef<HTMLButtonElement>(null);
  const relevant=(selectedKeys.length?sources.filter(source=>selectedKeys.includes(source.key)):sources).map((source,index)=>({source,index})).sort((a,b)=>priority[a.source.supportLevel]-priority[b.source.supportLevel]||a.index-b.index).map(item=>item.source);
  const visible=showAll?relevant:relevant.slice(0,3);
  useEffect(()=>{const previousOverflow=document.body.style.overflow;document.body.style.overflow="hidden";closeRef.current?.focus();function keydown(event:KeyboardEvent){if(event.key==="Escape")onClose();if(event.key!=="Tab"||!panelRef.current)return;const focusable=[...panelRef.current.querySelectorAll<HTMLElement>('button,summary,[href],[tabindex]:not([tabindex="-1"])')].filter(element=>!element.hasAttribute("disabled"));if(!focusable.length)return;const first=focusable[0],last=focusable.at(-1)!;if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}document.addEventListener("keydown",keydown);return()=>{document.body.style.overflow=previousOverflow;document.removeEventListener("keydown",keydown);};},[onClose]);
  return <div className="drawer-layer"><button type="button" className="drawer-backdrop" aria-label={language==="ar"?"إغلاق المصادر":"Close sources"} onClick={onClose}/><div className="source-drawer" role="dialog" aria-modal="true" aria-labelledby="source-drawer-title" ref={panelRef}><div className="source-drawer-header"><div><span className="eyebrow">{language==="ar"?"التوثيق":"Evidence"}</span><h2 id="source-drawer-title">{language==="ar"?"مصادر هذا الجزء":"Sources for this section"}</h2></div><button ref={closeRef} className="icon-button" type="button" onClick={onClose} aria-label={language==="ar"?"إغلاق درج المصادر":"Close source drawer"}><CloseIcon/></button></div><p className="drawer-intro">{language==="ar"?"ابدأ بالمصادر الأقرب إلى هذه الفكرة، وافتح البطاقة عند حاجتك إلى المواضع والتفاصيل.":"Start with the sources closest to this idea, then expand a card for locations and edition details."}</p><div className="source-list" id="source-list">{visible.map(source=><SourceCard source={source} language={language} key={source.key}/>)}</div>{!showAll&&relevant.length>3&&<button className="show-more-sources secondary-button" type="button" aria-expanded="false" aria-controls="source-list" onClick={()=>setShowAll(true)}>{language==="ar"?"عرض بقية المصادر":"Show remaining sources"}</button>}</div></div>;
}
