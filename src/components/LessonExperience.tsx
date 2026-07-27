"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Language, Lesson, LessonBlock, ProgressState } from "@/content/types";
import { emptyProgress, FOCUS_KEY, LESSON_ID, lessonRequirementsMet, parseProgress, passesQuiz, progressPercent, PROGRESS_KEY } from "@/lib/progress";
import { LanguageSwitch, useLanguage } from "./LanguageProvider";
import { LessonBlockRenderer } from "./LessonBlocks";
import { QuizPlayer } from "./QuizPlayer";
import { AllSourcesButton, SourceBadge, SourceProvider } from "./SourceSystem";
import { CheckIcon, CloseIcon, MenuIcon, SourceIcon } from "./icons";

type NavigatorProps = {
  blocks:LessonBlock[]; language:Language; progress:ProgressState; currentIndex:number;
  onNavigate:(key:string)=>void; compact?:boolean;
};

function stepState(index:number,currentIndex:number,progress:ProgressState,blocks:LessonBlock[]){
  if(index===currentIndex)return "current";
  if(progress.visitedCardIds.includes(blocks[index].key))return "completed";
  const highest=Math.max(-1,...progress.visitedCardIds.map(id=>blocks.findIndex(block=>block.key===id)));
  return index<=highest+1?"available":"not-reached";
}

function LessonNavigator({blocks,language,progress,currentIndex,onNavigate,compact=false}:NavigatorProps){
  const stateLabel={ar:{completed:"مكتمل",current:"الحالي",available:"متاح","not-reached":"لم تصل إليه"},en:{completed:"completed",current:"current",available:"available","not-reached":"not reached"}}[language];
  return <nav className={compact?"lesson-navigator compact":"lesson-navigator"} aria-label={language==="ar"?"في هذا الدرس":"In this lesson"}><span className="eyebrow">{language==="ar"?"في هذا الدرس":"In this lesson"}</span><ol>{blocks.map((block,index)=>{const state=stepState(index,currentIndex,progress,blocks);const disabled=state==="not-reached";return <li key={block.key}><button type="button" data-state={state} disabled={disabled} aria-current={state==="current"?"step":undefined} aria-label={`${index+1}. ${block.title[language]} — ${stateLabel[state]}`} onClick={()=>onNavigate(block.key)}><span>{state==="completed"?<CheckIcon/>:index+1}</span><span><strong>{block.title[language]}</strong><small>{stateLabel[state]}</small></span></button></li>})}</ol></nav>;
}

function NavigatorDrawer({open,onClose,...props}:NavigatorProps&{open:boolean;onClose:()=>void}){
  const closeRef=useRef<HTMLButtonElement>(null);const panelRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(!open)return;closeRef.current?.focus();function keydown(event:KeyboardEvent){if(event.key==="Escape")onClose();if(event.key!=="Tab"||!panelRef.current)return;const nodes=[...panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]),[href]')];if(!nodes.length)return;const first=nodes[0],last=nodes.at(-1)!;if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}document.addEventListener("keydown",keydown);return()=>document.removeEventListener("keydown",keydown)},[open,onClose]);
  if(!open)return null;
  return <div className="drawer-layer navigator-drawer-layer"><button className="drawer-backdrop" type="button" onClick={onClose} aria-label={props.language==="ar"?"إغلاق فهرس الدرس":"Close lesson navigator"}/><div className="navigator-drawer" role="dialog" aria-modal="true" aria-labelledby="navigator-drawer-title" ref={panelRef}><header><h2 id="navigator-drawer-title">{props.language==="ar"?"في هذا الدرس":"In this lesson"}</h2><button ref={closeRef} className="icon-button" type="button" onClick={onClose} aria-label={props.language==="ar"?"إغلاق":"Close"}><CloseIcon/></button></header><LessonNavigator {...props} compact onNavigate={key=>{props.onNavigate(key);onClose()}}/></div></div>;
}

function CardControls({index,total,language,onPrevious,onNext}: {index:number;total:number;language:Language;onPrevious:()=>void;onNext:()=>void}){
  return <nav className="card-controls" aria-label={language==="ar"?"التنقل بين بطاقات الدرس":"Lesson card navigation"}><button className="secondary-button" type="button" disabled={index===0} onClick={onPrevious}>{language==="ar"?"السابق":"Previous"}</button><strong>{language==="ar"?`${new Intl.NumberFormat("ar").format(index+1)} من ${new Intl.NumberFormat("ar").format(total)}`:`${index+1} of ${total}`}</strong><button className="primary-button" type="button" disabled={index===total-1} onClick={onNext}>{language==="ar"?"التالي":"Next"}</button></nav>;
}

export function LessonExperience({ lesson }: { lesson: Lesson }) {
  const {language}=useLanguage();
  const [progress,setProgress]=useState<ProgressState>(emptyProgress);
  const [navigatorOpen,setNavigatorOpen]=useState(false);
  const hydrated=useRef(false);const stageRef=useRef<HTMLDivElement>(null);const skipPersist=useRef(true);
  const requiredIds=useMemo(()=>lesson.blocks.filter(block=>block.requiredForCompletion).map(block=>block.key),[lesson.blocks]);

  useEffect(()=>{const restored=parseProgress(localStorage.getItem(PROGRESS_KEY));const sessionFocus=sessionStorage.getItem(FOCUS_KEY)==="true";const initialCard=lesson.blocks.some(block=>block.key===restored.currentCardId)?restored.currentCardId:"card-1";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress({...restored,currentCardId:initialCard,visitedCardIds:[...new Set([...restored.visitedCardIds,initialCard])],lessonOpened:true,focusMode:sessionFocus,lastVisitedAt:Date.now()});hydrated.current=true;},[lesson.blocks]);
  useEffect(()=>{if(skipPersist.current){skipPersist.current=false;return;}if(hydrated.current)localStorage.setItem(PROGRESS_KEY,JSON.stringify(progress));},[progress]);
  useEffect(()=>{
    // Mirror the independently persisted interface language into the versioned lesson-progress record.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(current=>current.preferredLanguage===language?current:{...current,preferredLanguage:language});
  },[language]);
  useEffect(()=>{const reset=()=>{setProgress({...emptyProgress,lessonOpened:true,visitedCardIds:["card-1"],lastVisitedAt:Date.now()});sessionStorage.removeItem(FOCUS_KEY)};window.addEventListener("prototype-progress-reset",reset);return()=>window.removeEventListener("prototype-progress-reset",reset)},[]);

  const currentIndex=Math.max(0,lesson.blocks.findIndex(block=>block.key===progress.currentCardId));
  const currentBlock=lesson.blocks[currentIndex];
  const percent=progressPercent(progress,lesson.blocks.length);
  const navigate=useCallback((key:string,deepKey?:string)=>{const index=lesson.blocks.findIndex(block=>block.key===key);if(index<0)return;setProgress(current=>({...current,currentCardId:key,visitedCardIds:[...new Set([...current.visitedCardIds,key])],expandedDeepSectionIds:deepKey?[...new Set([...current.expandedDeepSectionIds,deepKey])]:current.expandedDeepSectionIds}));window.requestAnimationFrame(()=>{stageRef.current?.scrollIntoView({block:"start",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});stageRef.current?.focus({preventScroll:true})})},[lesson.blocks]);
  const toggleDeep=useCallback((id:string,open:boolean)=>setProgress(current=>{const has=current.expandedDeepSectionIds.includes(id);if(has===open)return current;return{...current,expandedDeepSectionIds:open?[...current.expandedDeepSectionIds,id]:current.expandedDeepSectionIds.filter(item=>item!==id)}}),[]);
  const onAttempt=useCallback((score:number,total:number)=>setProgress(current=>{const ratio=score/total;const quizPassed=current.quizPassed||passesQuiz(score,total);const next={...current,quizAttempts:current.quizAttempts+1,bestQuizScore:Math.max(current.bestQuizScore,ratio),quizSubmitted:true,quizPassed};const complete=lessonRequirementsMet(next,requiredIds);return{...next,lessonCompleted:complete,completedLessonIds:complete?[...new Set([...next.completedLessonIds,LESSON_ID])]:next.completedLessonIds}}),[requiredIds]);
  function toggleFocus(){setProgress(current=>{const next=!current.focusMode;sessionStorage.setItem(FOCUS_KEY,String(next));return{...current,focusMode:next}})}

  const quizBlock=lesson.blocks.at(-1)!;
  const labels=language==="ar"?{quran:"القرآن",surah:"الفاتحة",lesson:"الدرس الأول",progress:"تقدم الدرس",sources:"المصادر",quiz:"اختبر فهمك",finishTitle:"أتممت الدرس بنجاح",finishBody:"اكتمل الدرس الأول فقط. ما يزال مسار سورة الفاتحة قيد التقدم.",review:"راجع الدرس",planned:"الدرس التالي مخطط لاحقًا",focus:"وضع التركيز",exitFocus:"إنهاء وضع التركيز",openNav:"في هذا الدرس",path:"تقدم مسار السورة: قيد التقدم"}:{quran:"Qur’an",surah:"Al-Fatihah",lesson:"Lesson 1",progress:"Lesson progress",sources:"Sources",quiz:"Check your understanding",finishTitle:"Lesson completed",finishBody:"Lesson 1 is complete. The Surah al-Fatihah path remains in progress.",review:"Review lesson",planned:"The next lesson is planned for later",focus:"Focus Mode",exitFocus:"Exit Focus Mode",openNav:"In this lesson",path:"Surah path progress: in progress"};

  return <SourceProvider sources={lesson.sources}><div className={progress.focusMode?"guided-lesson focus-mode":"guided-lesson"}>
    <nav className="lesson-progress-sticky" aria-label={labels.progress}><div className="shell"><button className="mobile-navigator-button" type="button" onClick={()=>setNavigatorOpen(true)}><MenuIcon/>{labels.openNav}</button><div className="progress-copy"><span>{labels.lesson}</span><strong>{percent}%</strong></div><div className="progress-track"><i style={{width:`${percent}%`}}/></div><button className="focus-toggle" type="button" aria-pressed={progress.focusMode} onClick={toggleFocus}>{progress.focusMode?labels.exitFocus:labels.focus}</button></div></nav>
    <main className="lesson-page"><div className="shell lesson-shell">
      <aside className="lesson-toc" aria-label={language==="ar"?"مستكشف خطوات الدرس":"Lesson step navigator"}><LessonNavigator blocks={lesson.blocks} language={language} progress={progress} currentIndex={currentIndex} onNavigate={navigate}/></aside>
      <div className="reading-column"><header className="lesson-header"><nav className="breadcrumbs" aria-label={language==="ar"?"مسار الصفحة":"Breadcrumb"}><Link href="/quran">{labels.quran}</Link><span>/</span><Link href="/quran/al-fatihah">{labels.surah}</Link><span>/</span><span>{labels.lesson}</span></nav><div className="lesson-kicker"><span>{labels.lesson}</span><span>·</span><span>{lesson.readingTime[language]}</span></div><h1>{lesson.title[language]}</h1><p className="surah-label">{lesson.surahName[language]}</p><div className="lesson-header-actions"><LanguageSwitch/><AllSourcesButton count={lesson.sources.length}/></div></header>
        <div className="guided-card-stage" ref={stageRef} tabIndex={-1} aria-live="polite" data-current-card={currentBlock.key}>
          {currentBlock.type!=="quiz_sources"?<LessonBlockRenderer block={currentBlock} language={language} expandedDeepIds={progress.expandedDeepSectionIds} onToggleDeep={toggleDeep}/>:<section id={quizBlock.key} className="lesson-block quiz-section" aria-labelledby="quiz-title"><header className="block-heading"><div><span className="eyebrow">{labels.lesson}</span><h2 id="quiz-title">{quizBlock.title[language]}</h2></div><SourceBadge sourceKeys={quizBlock.sourceKeys} label={quizBlock.sourceSummary[language]}/></header><p className="quiz-intro">{quizBlock.items[language][0]}</p><QuizPlayer questions={lesson.quiz} language={language} onAttempt={onAttempt} onReview={navigate}/></section>}
          <CardControls index={currentIndex} total={lesson.blocks.length} language={language} onPrevious={()=>navigate(lesson.blocks[currentIndex-1].key)} onNext={()=>navigate(lesson.blocks[currentIndex+1].key)}/>
        </div>
        {progress.lessonCompleted&&<section className="completion-card lesson-only-completion" data-testid="lesson-completed"><div className="completion-icon"><CheckIcon/></div><div><span className="eyebrow">{labels.path}</span><h2>{labels.finishTitle}</h2><p>{labels.finishBody}</p><div className="completion-actions"><button type="button" className="secondary-button" onClick={()=>navigate("card-1")}>{labels.review}</button><button type="button" className="primary-button" disabled>{labels.planned}</button></div></div></section>}
      </div>
      <aside className="source-rail" aria-label={language==="ar"?"مصادر البطاقة الحالية":"Current card sources"}><div><SourceIcon/><span className="eyebrow">{labels.sources}</span><h2>{currentBlock.sourceSummary[language]}</h2><SourceBadge sourceKeys={currentBlock.sourceKeys}/></div></aside>
    </div></main>
    <NavigatorDrawer open={navigatorOpen} onClose={()=>setNavigatorOpen(false)} blocks={lesson.blocks} language={language} progress={progress} currentIndex={currentIndex} onNavigate={navigate}/>
  </div></SourceProvider>;
}
