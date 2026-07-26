"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Lesson, ProgressState } from "@/content/types";
import { emptyProgress, parseProgress, progressPercent, PROGRESS_KEY } from "@/lib/progress";
import { LanguageSwitch, useLanguage } from "./LanguageProvider";
import { LessonBlockRenderer } from "./LessonBlocks";
import { QuizPlayer } from "./QuizPlayer";
import { AllSourcesButton, SourceProvider } from "./SourceSystem";
import { CheckIcon, SourceIcon } from "./icons";

export function LessonExperience({ lesson }: { lesson: Lesson }) {
  const { language } = useLanguage(); const [progress,setProgress]=useState<ProgressState>(emptyProgress);
  const skipInitialPersist = useRef(true);
  useEffect(()=>{
    // Progress is browser-only, so it is restored after the server render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress({...parseProgress(localStorage.getItem(PROGRESS_KEY)),lessonOpened:true});
  },[]);
  useEffect(()=>{if(skipInitialPersist.current){skipInitialPersist.current=false;return;}localStorage.setItem(PROGRESS_KEY,JSON.stringify(progress));},[progress]);
  useEffect(()=>{const reset=()=>setProgress(emptyProgress);window.addEventListener("prototype-progress-reset",reset);return()=>window.removeEventListener("prototype-progress-reset",reset);},[]);
  useEffect(()=>{const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){const key=(entry.target as HTMLElement).dataset.blockKey;if(key)setProgress(current=>current.viewedBlocks.includes(key)?current:{...current,viewedBlocks:[...current.viewedBlocks,key]});}}},{threshold:.45});document.querySelectorAll("[data-block-key]").forEach(element=>observer.observe(element));return()=>observer.disconnect();},[]);
  const percent=progressPercent(progress,lesson.blocks.length);
  const quizComplete=useCallback(()=>setProgress(current=>current.quizCompleted?current:{...current,quizCompleted:true}),[]);
  const visibleBlocks=lesson.blocks.filter(block=>block.type!=="quiz_sources"); const quizBlock=lesson.blocks.find(block=>block.type==="quiz_sources")!;
  const labels=language==="ar"?{quran:"القرآن",surah:"الفاتحة",lesson:"الدرس الأول",progress:"تقدم الدرس",toc:"في هذا الدرس",sources:"المصادر",complete:"وضع علامة مكتمل",completed:"اكتمل الدرس",quiz:"اختبر فهمك",finishTitle:"أنهيت الدرس الأول",finishBody:"يمكنك مراجعة المصادر أو إعادة الاختبار في أي وقت.",planned:"الدرس التالي مخطط لاحقًا"}:{quran:"Qur’an",surah:"Al-Fatihah",lesson:"Lesson 1",progress:"Lesson progress",toc:"In this lesson",sources:"Sources",complete:"Mark lesson complete",completed:"Lesson complete",quiz:"Check your understanding",finishTitle:"You finished Lesson 1",finishBody:"You can revisit the sources or retry the quiz at any time.",planned:"The next lesson is planned for later"};
  return <SourceProvider sources={lesson.sources}><nav className="lesson-progress-sticky" aria-label={labels.progress}><div className="shell"><div className="progress-copy"><span>{labels.lesson}</span><strong>{percent}%</strong></div><div className="progress-track"><i style={{width:`${percent}%`}}/></div></div></nav>
    <main className="lesson-page"><div className="shell lesson-shell">
      <aside className="lesson-toc" aria-label={labels.toc}><span className="eyebrow">{labels.toc}</span><ol>{visibleBlocks.map((block,index)=><li key={block.key}><a href={`#${block.key}`} data-viewed={progress.viewedBlocks.includes(block.key)}><span>{index+1}</span>{block.title[language]}</a></li>)}<li><a href="#lesson-quiz" data-viewed={progress.quizCompleted}><span>10</span>{labels.quiz}</a></li></ol></aside>
      <div className="reading-column"><header className="lesson-header"><nav className="breadcrumbs" aria-label={language==="ar"?"مسار الصفحة":"Breadcrumb"}><Link href="/quran">{labels.quran}</Link><span>/</span><Link href="/quran/al-fatihah">{labels.surah}</Link><span>/</span><span>{labels.lesson}</span></nav><div className="lesson-kicker"><span>{labels.lesson}</span><span>·</span><span>{lesson.readingTime[language]}</span></div><h1>{lesson.title[language]}</h1><p className="surah-label">{lesson.surahName[language]}</p><div className="lesson-header-actions"><LanguageSwitch/><AllSourcesButton count={lesson.sources.length}/></div></header>
        {visibleBlocks.map(block=><LessonBlockRenderer key={block.key} block={block} language={language}/>)}
        <section id="lesson-quiz" data-block-key={quizBlock.key} className="lesson-block quiz-section" aria-labelledby="quiz-title"><header className="block-heading"><div><span className="eyebrow">{labels.lesson}</span><h2 id="quiz-title">{quizBlock.title[language]}</h2></div></header><p className="quiz-intro">{quizBlock.items[language][0]}</p><QuizPlayer questions={lesson.quiz} language={language} onComplete={quizComplete}/></section>
        <section className="completion-card"><div className="completion-icon"><CheckIcon/></div><div><span className="eyebrow">{progress.lessonCompleted?labels.completed:labels.planned}</span><h2>{labels.finishTitle}</h2><p>{labels.finishBody}</p><div className="completion-actions"><button type="button" className="primary-button" onClick={()=>setProgress(current=>({...current,lessonCompleted:!current.lessonCompleted}))}><CheckIcon/>{progress.lessonCompleted?labels.completed:labels.complete}</button><AllSourcesButton count={lesson.sources.length}/></div></div></section>
      </div>
      <aside className="source-rail"><div><SourceIcon/><span className="eyebrow">{labels.sources}</span><h2>{language==="ar"?"اقرأ بهدوء، وراجع الدليل عند الحاجة":"Read calmly; check the evidence when needed"}</h2><p>{language==="ar"?"تفتح شارات المصادر بيانات الكتاب والصفحة دون إظهار سجلات العمل الداخلية.":"Source badges open book and page details without exposing internal working records."}</p><AllSourcesButton count={lesson.sources.length}/></div></aside>
    </div></main>
  </SourceProvider>;
}
