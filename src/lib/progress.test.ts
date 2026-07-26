import { describe, expect, it } from "vitest";
import { answersMatch, emptyProgress, lessonRequirementsMet, parseProgress, passesQuiz, progressPercent } from "./progress";

describe("progress and quiz helpers", () => {
  it("restores safe progress and rejects corrupt storage", () => {
    expect(parseProgress(null)).toEqual(emptyProgress);
    expect(parseProgress("not-json")).toEqual(emptyProgress);
    expect(parseProgress('{"lessonOpened":true,"viewedBlocks":["block-1"],"quizCompleted":true,"lessonCompleted":true}')).toMatchObject({ lessonOpened: true, currentCardId:"card-1", visitedCardIds: ["card-1"], quizSubmitted:false, quizPassed:false, lessonCompleted:false });
  });
  it("calculates bounded progress", () => {
    expect(progressPercent({ ...emptyProgress, visitedCardIds: ["a","b"] }, 10)).toBe(20);
    expect(progressPercent({ ...emptyProgress, visitedCardIds: Array.from({length:20},(_,i)=>String(i)) }, 10)).toBe(100);
  });
  it("validates ordered, selected, boolean, and recall answers", () => {
    expect(answersMatch(["a","b"],["a","b"])).toBe(true);
    expect(answersMatch(["b","a"],["a","b"])).toBe(false);
    expect(answersMatch(false,false)).toBe(true);
    expect(answersMatch("A reflection",null)).toBe(true);
  });
  it("requires a score strictly greater than 50 percent", () => {
    expect(passesQuiz(5,10)).toBe(false);
    expect(passesQuiz(6,10)).toBe(true);
    expect(passesQuiz(4,7)).toBe(true);
  });
  it("completes only after every required card is visited and the quiz passes", () => {
    const required=["card-1","card-2","card-3"];
    expect(lessonRequirementsMet({...emptyProgress,visitedCardIds:required,quizSubmitted:true,quizPassed:true},required)).toBe(true);
    expect(lessonRequirementsMet({...emptyProgress,visitedCardIds:required.slice(0,2),quizSubmitted:true,quizPassed:true},required)).toBe(false);
    expect(lessonRequirementsMet({...emptyProgress,visitedCardIds:required,quizSubmitted:true,quizPassed:false},required)).toBe(false);
  });
});
