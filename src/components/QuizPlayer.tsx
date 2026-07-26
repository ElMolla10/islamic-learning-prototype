"use client";

import { useEffect, useMemo, useState } from "react";
import type { Language, QuizQuestion } from "@/content/types";
import { answersMatch, passesQuiz, QUIZ_KEY } from "@/lib/progress";
import { attemptOrdersAreValid, createAttemptOrders, initialAnswers, orderedOptions, type AttemptOrders, type QuizAnswer, validQuizAnswer } from "@/lib/quiz";
import { CheckIcon, MoveDownIcon, MoveUpIcon } from "./icons";

type QuizState = {
  version:2;
  current:number;
  answers:Record<string,QuizAnswer>;
  submitted:string[];
  attemptRecorded:boolean;
  attempt:number;
  orders:AttemptOrders;
};

function newAttempt(questions:QuizQuestion[],previous?:AttemptOrders,attempt=1):QuizState{
  const orders=createAttemptOrders(questions,Math.random,previous);
  return {version:2,current:0,answers:initialAnswers(questions,orders),submitted:[],attemptRecorded:false,attempt,orders};
}

function restoredAttempt(raw:string|null,questions:QuizQuestion[]):QuizState|null{
  if(!raw)return null;
  try{
    const parsed=JSON.parse(raw) as QuizState;
    if(parsed.version!==2||!attemptOrdersAreValid(questions,parsed.orders)||!Array.isArray(parsed.submitted)||typeof parsed.answers!=="object")return null;
    return {...parsed,current:Math.min(Math.max(0,parsed.current),questions.length-1)};
  }catch{return null;}
}

function correctAnswer(question:QuizQuestion,answer:QuizAnswer|undefined){
  return answer!==undefined&&answersMatch(answer,question.correctAnswer,question.type==="ordering");
}

export function QuizPlayer({ questions, language, onAttempt, onReview }: {
  questions:QuizQuestion[];
  language:Language;
  onAttempt:(score:number,total:number)=>void;
  onReview:(cardKey:string,deepSectionKey?:string)=>void;
}) {
  const [state,setState]=useState<QuizState|null>(null);
  useEffect(()=>{
    // Quiz order is created after hydration to avoid random server/client markup differences.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(restoredAttempt(sessionStorage.getItem(QUIZ_KEY),questions)??newAttempt(questions));
  },[questions]);
  useEffect(()=>{if(state)sessionStorage.setItem(QUIZ_KEY,JSON.stringify(state));},[state]);

  const question=state?questions[state.current]:null;
  const answer=state&&question?state.answers[question.key]:undefined;
  const submitted=Boolean(state&&question&&state.submitted.includes(question.key));
  const correct=Boolean(question&&submitted&&correctAnswer(question,answer));
  const score=useMemo(()=>state?questions.filter(item=>state.submitted.includes(item.key)&&correctAnswer(item,state.answers[item.key])).length:0,[questions,state]);
  const complete=Boolean(state&&state.submitted.length===questions.length);
  const passed=passesQuiz(score,questions.length);
  const correctQuestions=state?questions.filter(item=>state.submitted.includes(item.key)&&correctAnswer(item,state.answers[item.key])):[];
  const incorrect=state?questions.filter(item=>state.submitted.includes(item.key)&&!correctAnswer(item,state.answers[item.key])):[];

  if(!state||!question)return <div className="quiz-player quiz-loading" aria-live="polite">{language==="ar"?"يُجهّز الاختبار…":"Preparing assessment…"}</div>;

  const labels=language==="ar"?{
    question:(x:number,y:number)=>`السؤال ${x} من ${y}`,submit:"تحقق من الإجابة",next:"السؤال التالي",previous:"السؤال السابق",correct:"إجابة صحيحة",incorrect:"إجابة غير صحيحة",true:"صحيح",false:"خطأ",pass:"أتممت الدرس بنجاح",fail:"تحتاج بعض الأفكار إلى مراجعة",deep:"من قسم تعمّق أكثر",core:"من الفكرة الأساسية",review:"راجع هذه الفكرة",reviewAll:"راجع الإجابات غير الصحيحة",retryAssessment:"أعد الاختبار",select:"اختر المعنى",passRule:"النجاح يحتاج إلى أكثر من ٥٠٪",score:"النتيجة",right:"مفاهيم أجبت عنها بصورة صحيحة",revisit:"مفاهيم تحتاج إلى مراجعة",none:"لا توجد",returnLesson:"العودة إلى الدرس",continueLater:"المتابعة عند توفر الدرس التالي"
  }:{
    question:(x:number,y:number)=>`Question ${x} of ${y}`,submit:"Check answer",next:"Next Question",previous:"Previous Question",correct:"Correct answer",incorrect:"Incorrect answer",true:"True",false:"False",pass:"Lesson completed",fail:"A few ideas need review",deep:"From Go deeper",core:"From the core idea",review:"Review this idea",reviewAll:"Review incorrect answers",retryAssessment:"Retry quiz",select:"Choose a meaning",passRule:"Passing requires more than 50%",score:"Score",right:"Concepts answered correctly",revisit:"Concepts to revisit",none:"None",returnLesson:"Return to lesson",continueLater:"Continue when the next lesson is available"
  };

  const displayedOptions=orderedOptions(question,state.orders);
  const valid=validQuizAnswer(question,answer);
  function update(value:QuizAnswer){setState(current=>current?{...current,answers:{...current.answers,[question!.key]:value}}:current);}
  function submit(){
    if(!valid||submitted)return;
    const nextSubmitted=[...new Set([...state!.submitted,question!.key])];
    const nowComplete=nextSubmitted.length===questions.length;
    const next={...state!,submitted:nextSubmitted,attemptRecorded:nowComplete?true:state!.attemptRecorded};
    setState(next);
    if(nowComplete&&!state!.attemptRecorded){
      const nextScore=questions.filter(item=>nextSubmitted.includes(item.key)&&correctAnswer(item,next.answers[item.key])).length;
      window.setTimeout(()=>onAttempt(nextScore,questions.length),0);
    }
  }
  function retryAssessment(){setState(newAttempt(questions,state!.orders,state!.attempt+1));}
  function move(id:string,direction:-1|1){const order=Array.isArray(answer)?[...answer]:[];const at=order.indexOf(id),to=at+direction;if(to<0||to>=order.length)return;[order[at],order[to]]=[order[to],order[at]];update(order);}
  function match(rowId:string,choiceId:string){const current=Array.isArray(answer)?answer.filter(item=>!item.startsWith(`${rowId}=`)):[];update([...current,`${rowId}=${choiceId}`]);}
  function matched(rowId:string){return Array.isArray(answer)?answer.find(item=>item.startsWith(`${rowId}=`))?.split("=")[1]??"":"";}

  return <div className="quiz-player" data-testid="quiz-player" data-attempt={state.attempt}>
    <div className="quiz-topline"><strong className="question-count">{labels.question(state.current+1,questions.length)}</strong><span className="question-depth" data-depth={question.depth}>{question.depth==="deep"?labels.deep:labels.core}</span><div className="quiz-dots" aria-hidden="true">{questions.map((item,index)=><i key={item.key} data-state={state.submitted.includes(item.key)?"done":index===state.current?"current":"upcoming"}/>)}</div></div>
    <h3>{question.prompt[language]}</h3>
    <div className="quiz-answer-area">
      {(question.type==="multiple_choice"||question.type==="select_all"||question.type==="scenario")&&displayedOptions.map(option=>{const selected=Array.isArray(answer)&&answer.includes(option.id);return <label className="quiz-option" data-option-id={option.id} data-selected={selected} key={option.id}><input type={question.type==="select_all"?"checkbox":"radio"} name={question.key} checked={selected} disabled={submitted} onChange={()=>{const current=Array.isArray(answer)?answer:[];update(question.type==="select_all"?(selected?current.filter(id=>id!==option.id):[...current,option.id]):[option.id]);}}/><span>{option.label[language]}</span></label>})}
      {question.type==="true_false"&&[true,false].map(value=><label className="quiz-option" data-selected={answer===value} key={String(value)}><input type="radio" name={question.key} checked={answer===value} disabled={submitted} onChange={()=>update(value)}/><span>{value?labels.true:labels.false}</span></label>)}
      {question.type==="ordering"&&<div className="ordering-list">{(Array.isArray(answer)?answer:[]).map((id,index)=>{const option=question.options.find(item=>item.id===id)!;return <div className="ordering-item" data-option-id={id} key={id}><span>{index+1}</span><strong>{option.label[language]}</strong><div><button type="button" disabled={submitted||index===0} onClick={()=>move(id,-1)} aria-label={`${language==="ar"?"تحريك لأعلى":"Move up"}: ${option.label[language]}`}><MoveUpIcon/></button><button type="button" disabled={submitted||index===question.options.length-1} onClick={()=>move(id,1)} aria-label={`${language==="ar"?"تحريك لأسفل":"Move down"}: ${option.label[language]}`}><MoveDownIcon/></button></div></div>})}</div>}
      {question.type==="matching"&&<div className="matching-list">{question.matchingRows.map(row=><label key={row.id}><span>{row.label[language]}</span><select value={matched(row.id)} disabled={submitted} onChange={event=>match(row.id,event.target.value)} aria-label={`${row.label[language]} — ${labels.select}`}><option value="">{labels.select}</option>{displayedOptions.map(option=><option value={option.id} key={option.id}>{option.label[language]}</option>)}</select></label>)}</div>}
    </div>
    {!submitted?<button className="primary-button check-answer" type="button" disabled={!valid} onClick={submit}>{labels.submit}</button>:<div className="quiz-feedback" data-correct={correct} role="status"><strong>{correct?<><CheckIcon/>{labels.correct}</>:labels.incorrect}</strong>{question.explanation[language]&&<p>{question.explanation[language]}</p>}{!correct&&<button className="review-link" type="button" onClick={()=>onReview(question.reviewCardKey,question.reviewDeepSectionKey)}>{labels.review}</button>}</div>}
    <div className="quiz-navigation"><button className="secondary-button" type="button" disabled={state.current===0} onClick={()=>setState(current=>current?{...current,current:current.current-1}:current)}>{labels.previous}</button>{submitted&&state.current<questions.length-1&&<button className="primary-button next-question" type="button" onClick={()=>setState(current=>current?{...current,current:current.current+1}:current)}>{labels.next}</button>}</div>
    {complete&&<section className="quiz-result" data-passed={passed} role="status"><CheckIcon/><div><span>{labels.passRule}</span><strong>{passed?labels.pass:labels.fail}</strong><p><b>{labels.score}:</b> {score} / {questions.length}</p><div className="result-concepts"><section><h4>{labels.right}</h4>{correctQuestions.length?<ul>{correctQuestions.map(item=><li key={item.key}>{item.prompt[language]}</li>)}</ul>:<p>{labels.none}</p>}</section><section><h4>{labels.revisit}</h4>{incorrect.length?<ul>{incorrect.map(item=><li key={item.key}><span>{item.prompt[language]}</span><button type="button" onClick={()=>onReview(item.reviewCardKey,item.reviewDeepSectionKey)}>{labels.review}</button></li>)}</ul>:<p>{labels.none}</p>}</section></div><div className="result-actions">{incorrect.length>0&&<button className="secondary-button" type="button" onClick={()=>onReview(incorrect[0].reviewCardKey,incorrect[0].reviewDeepSectionKey)}>{labels.reviewAll}</button>}{!passed&&<button className="secondary-button" type="button" onClick={retryAssessment}>{labels.retryAssessment}</button>}<button className="secondary-button" type="button" onClick={()=>onReview("card-1")}>{labels.returnLesson}</button><button className="primary-button" type="button" disabled>{labels.continueLater}</button></div></div></section>}
  </div>;
}
