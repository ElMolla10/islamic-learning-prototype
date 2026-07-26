import { describe,expect,it } from "vitest";
import type { QuizQuestion } from "@/content/types";
import { answersMatch } from "./progress";
import { attemptOrdersAreValid,createAttemptOrders,initialAnswers,orderedOptions,validQuizAnswer } from "./quiz";

const question:QuizQuestion={key:"q",type:"multiple_choice",prompt:{ar:"س",en:"Q"},options:["a","b","c"].map(id=>({id,label:{ar:id,en:id}})),matchingRows:[],correctAnswer:["a"],explanation:{ar:"",en:""},depth:"core",reviewCardKey:"card-1"};
const sequence=(values:number[])=>{let index=0;return()=>values[index++%values.length];};

describe("quiz attempt ordering",()=>{
  it("does not mutate content and keeps one generated order stable",()=>{
    const original=question.options.map(option=>option.id);const orders=createAttemptOrders([question],sequence([.8,.1]));
    expect(question.options.map(option=>option.id)).toEqual(original);
    expect(orderedOptions(question,orders).map(option=>option.id)).toEqual(orders.q);
    expect(orderedOptions(question,orders).map(option=>option.id)).toEqual(orders.q);
    expect(attemptOrdersAreValid([question],orders)).toBe(true);
  });
  it("guarantees a fresh order on retry",()=>{
    const first=createAttemptOrders([question],()=>0);const retry=createAttemptOrders([question],()=>0,first);
    expect(retry.q).not.toEqual(first.q);
  });
  it("validates by answer ID after display shuffling",()=>{
    const orders=createAttemptOrders([question],()=>0);
    expect(orders.q[0]).not.toBe("a");
    expect(answersMatch(["a"],question.correctAnswer)).toBe(true);
    expect(answersMatch([orders.q[0]],question.correctAnswer)).toBe(false);
  });
  it("does not disproportionately place the correct answer first",()=>{
    let seed=0x12345678;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32;};const positions=[0,0,0];
    for(let attempt=0;attempt<900;attempt+=1){const order=createAttemptOrders([question],random).q;positions[order.indexOf("a")]+=1;}
    positions.forEach(count=>expect(count).toBeGreaterThan(240));positions.forEach(count=>expect(count).toBeLessThan(360));
  });
  it("requires complete machine-gradable responses",()=>{
    expect(validQuizAnswer(question,undefined)).toBe(false);expect(validQuizAnswer(question,["a"])).toBe(true);
    const ordering={...question,type:"ordering" as const};const orders=createAttemptOrders([ordering],()=>0);expect(validQuizAnswer(ordering,initialAnswers([ordering],orders).q)).toBe(true);
  });
});
