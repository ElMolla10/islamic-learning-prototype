import type { QuizQuestion } from "@/content/types";

export type AttemptOrders = Record<string,string[]>;
export type QuizAnswer = string[] | boolean;

export function shuffled<T>(values: readonly T[], random:()=>number=Math.random):T[]{
  const result=[...values];
  for(let index=result.length-1;index>0;index-=1){
    const target=Math.floor(random()*(index+1));
    [result[index],result[target]]=[result[target],result[index]];
  }
  return result;
}

function sameOrder(a:string[]|undefined,b:string[]){return Boolean(a)&&a!.length===b.length&&a!.every((value,index)=>value===b[index]);}

export function createAttemptOrders(questions:QuizQuestion[],random:()=>number=Math.random,previous?:AttemptOrders):AttemptOrders{
  return Object.fromEntries(questions.filter(question=>question.options.length>1).map(question=>{
    let order=shuffled(question.options.map(option=>option.id),random);
    if(sameOrder(previous?.[question.key],order))order=[...order.slice(1),order[0]];
    return [question.key,order];
  }));
}

export function attemptOrdersAreValid(questions:QuizQuestion[],orders:AttemptOrders){
  return questions.filter(question=>question.options.length>1).every(question=>{
    const expected=question.options.map(option=>option.id).sort();
    const actual=orders[question.key];
    return Array.isArray(actual)&&actual.length===expected.length&&[...actual].sort().every((id,index)=>id===expected[index]);
  });
}

export function initialAnswers(questions:QuizQuestion[],orders:AttemptOrders):Record<string,QuizAnswer>{
  return Object.fromEntries(questions.filter(question=>question.type==="ordering").map(question=>[question.key,[...(orders[question.key]??question.options.map(option=>option.id))]]));
}

export function orderedOptions(question:QuizQuestion,orders:AttemptOrders){
  const byId=new Map(question.options.map(option=>[option.id,option]));
  return (orders[question.key]??question.options.map(option=>option.id)).map(id=>byId.get(id)).filter((option):option is QuizQuestion["options"][number]=>Boolean(option));
}

export function validQuizAnswer(question:QuizQuestion,answer:QuizAnswer|undefined){
  if(question.type==="true_false")return typeof answer==="boolean";
  if(!Array.isArray(answer))return false;
  if(question.type==="matching")return answer.length===question.matchingRows.length&&question.matchingRows.every(row=>answer.some(value=>value.startsWith(`${row.id}=`)&&value.split("=")[1]));
  if(question.type==="ordering")return answer.length===question.options.length;
  return answer.length>0;
}
