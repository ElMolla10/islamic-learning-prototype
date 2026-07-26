import { describe, expect, it } from "vitest";
import { answersMatch, emptyProgress, parseProgress, progressPercent } from "./progress";

describe("progress and quiz helpers", () => {
  it("restores safe progress and rejects corrupt storage", () => {
    expect(parseProgress(null)).toEqual(emptyProgress);
    expect(parseProgress("not-json")).toEqual(emptyProgress);
    expect(parseProgress('{"lessonOpened":true,"viewedBlocks":["block-1"],"quizCompleted":true}')).toMatchObject({ lessonOpened: true, viewedBlocks: ["block-1"], quizCompleted: true });
  });
  it("calculates bounded progress", () => {
    expect(progressPercent({ ...emptyProgress, viewedBlocks: ["a","b"] }, 10)).toBe(18);
    expect(progressPercent({ ...emptyProgress, viewedBlocks: Array(20).fill("x"), lessonCompleted: true }, 10)).toBe(100);
  });
  it("validates ordered, selected, boolean, and recall answers", () => {
    expect(answersMatch(["a","b"],["a","b"])).toBe(true);
    expect(answersMatch(["b","a"],["a","b"])).toBe(false);
    expect(answersMatch(false,false)).toBe(true);
    expect(answersMatch("A reflection",null)).toBe(true);
  });
});
