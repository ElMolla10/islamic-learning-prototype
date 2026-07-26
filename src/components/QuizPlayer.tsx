"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Language, QuizQuestion } from "@/content/types";
import { answersMatch, QUIZ_KEY } from "@/lib/progress";
import { CheckIcon, MoveDownIcon, MoveUpIcon } from "./icons";

type Answer = string[] | boolean | string;
type QuizState = { current: number; answers: Record<string, Answer>; submitted: string[] };
const initial: QuizState = { current: 0, answers: {}, submitted: [] };

export function QuizPlayer({ questions, language, onComplete }: { questions: QuizQuestion[]; language: Language; onComplete: () => void }) {
  const [state,setState]=useState<QuizState>(initial);
  const skipInitialPersist = useRef(true);
  useEffect(() => { try { const saved=sessionStorage.getItem(QUIZ_KEY); if(saved) {
    // Quiz answers are intentionally restored from this browser session after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(JSON.parse(saved) as QuizState);
  } } catch { /* ignore corrupt session state */ } },[]);
  useEffect(() => { if(skipInitialPersist.current){skipInitialPersist.current=false;return;}sessionStorage.setItem(QUIZ_KEY,JSON.stringify(state)); },[state]);
  const question=questions[state.current]; const answer=state.answers[question.key]; const submitted=state.submitted.includes(question.key);
  const correct=useMemo(() => submitted && answersMatch(answer ?? "",question.correctAnswer),[submitted,answer,question.correctAnswer]);
  const score=questions.filter((item) => state.submitted.includes(item.key) && answersMatch(state.answers[item.key] ?? "",item.correctAnswer)).length;
  const complete=state.submitted.length===questions.length;
  useEffect(() => { if(complete) onComplete(); },[complete,onComplete]);
  function update(value:Answer){setState(s=>({...s,answers:{...s.answers,[question.key]:value}}));}
  function submit(){
    const submittedAnswer = answer === undefined && question.type === "ordering" ? question.options.map((option) => option.id) : answer;
    if(submittedAnswer===undefined || (typeof submittedAnswer==="string" && !submittedAnswer.trim())) return;
    setState(s=>({...s,answers:{...s.answers,[question.key]:submittedAnswer},submitted:[...new Set([...s.submitted,question.key])]}));
  }
  function retry(){setState(s=>({...s,answers:{...s.answers,[question.key]:question.type==="ordering"?question.options.map(x=>x.id):[]},submitted:s.submitted.filter(k=>k!==question.key)}));}
  function move(id:string,direction:-1|1){const order=Array.isArray(answer)?[...answer]:question.options.map(x=>x.id);const at=order.indexOf(id),to=at+direction;if(to<0||to>=order.length)return;[order[at],order[to]]=[order[to],order[at]];update(order);}
  const labels=language==="ar"?{question:"السؤال",submit:"تحقق",next:"التالي",previous:"السابق",retry:"حاول مرة أخرى",correct:"إجابة موفقة",incorrect:"راجع الفكرة ثم حاول مرة أخرى",true:"صحيح",false:"خطأ",recall:"اكتب إجابتك هنا",result:"مفاهيم تذكّرتها",finish:"أتممت المراجعة"}:{question:"Question",submit:"Check answer",next:"Next",previous:"Previous",retry:"Try again",correct:"Well recalled",incorrect:"Review the idea, then try again",true:"True",false:"False",recall:"Write your response here",result:"concepts recalled",finish:"Review complete"};
  return <div className="quiz-player" data-testid="quiz-player"><div className="quiz-topline"><span>{labels.question} {state.current+1} / {questions.length}</span><div className="quiz-dots" aria-hidden="true">{questions.map((q,i)=><i key={q.key} data-state={state.submitted.includes(q.key)?"done":i===state.current?"current":"upcoming"}/>)}</div></div><h3>{question.prompt[language]}</h3>
    <div className="quiz-answer-area">
      {(question.type==="multiple_choice"||question.type==="select_all")&&question.options.map(option=>{const selected=Array.isArray(answer)&&answer.includes(option.id);return <label className="quiz-option" data-selected={selected} key={option.id}><input type={question.type==="select_all"?"checkbox":"radio"} name={question.key} checked={selected} disabled={submitted} onChange={()=>{const current=Array.isArray(answer)?answer:[];update(question.type==="select_all"?(selected?current.filter(x=>x!==option.id):[...current,option.id]):[option.id]);}}/><span>{option.label[language]}</span></label>})}
      {question.type==="true_false"&&[true,false].map(value=><label className="quiz-option" data-selected={answer===value} key={String(value)}><input type="radio" name={question.key} checked={answer===value} disabled={submitted} onChange={()=>update(value)}/><span>{value?labels.true:labels.false}</span></label>)}
      {question.type==="ordering"&&<div className="ordering-list">{(Array.isArray(answer)?answer:question.options.map(x=>x.id)).map((id,index)=>{const option=question.options.find(x=>x.id===id)!;return <div className="ordering-item" key={id}><span>{index+1}</span><strong>{option.label[language]}</strong><div><button type="button" disabled={submitted||index===0} onClick={()=>move(id,-1)} aria-label={`${language==="ar"?"تحريك لأعلى":"Move up"}: ${option.label[language]}`}><MoveUpIcon/></button><button type="button" disabled={submitted||index===question.options.length-1} onClick={()=>move(id,1)} aria-label={`${language==="ar"?"تحريك لأسفل":"Move down"}: ${option.label[language]}`}><MoveDownIcon/></button></div></div>})}</div>}
      {question.type==="short_recall"&&<textarea value={typeof answer==="string"?answer:""} disabled={submitted} onChange={event=>update(event.target.value)} placeholder={labels.recall} rows={4}/>} 
    </div>
    {!submitted?<button className="primary-button" type="button" onClick={submit}>{labels.submit}</button>:<div className="quiz-feedback" data-correct={correct}><strong>{correct?<><CheckIcon/>{labels.correct}</>:labels.incorrect}</strong>{question.explanation[language]&&<p>{question.explanation[language]}</p>}<button className="text-button" type="button" onClick={retry}>{labels.retry}</button></div>}
    <div className="quiz-navigation"><button className="secondary-button" type="button" disabled={state.current===0} onClick={()=>setState(s=>({...s,current:s.current-1}))}>{labels.previous}</button><button className="secondary-button" type="button" disabled={state.current===questions.length-1} onClick={()=>setState(s=>({...s,current:s.current+1}))}>{labels.next}</button></div>
    {complete&&<div className="quiz-result" role="status"><CheckIcon/><div><strong>{labels.finish}</strong><p>{score} / {questions.length} {labels.result}</p></div></div>}
  </div>;
}
