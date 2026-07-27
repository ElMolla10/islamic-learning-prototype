import { describe, expect, it } from "vitest";
import { derivePathStatus } from "./PathProgressPills";

describe("derivePathStatus", () => {
  it("is not_started when nothing has been opened", () => {
    expect(derivePathStatus(0, 6, false)).toBe("not_started");
  });

  it("is in_progress once something has started, even if one lesson is already complete, as long as the total isn't fully reached", () => {
    expect(derivePathStatus(1, 6, true)).toBe("in_progress");
    expect(derivePathStatus(1, 11, true)).toBe("in_progress");
  });

  it("is completed only once completedCount reaches the true total lesson/chapter count", () => {
    expect(derivePathStatus(6, 6, true)).toBe("completed");
    expect(derivePathStatus(11, 11, true)).toBe("completed");
    expect(derivePathStatus(5, 6, true)).toBe("in_progress");
  });

  it("never reports completed for a zero-length path", () => {
    expect(derivePathStatus(0, 0, false)).toBe("not_started");
  });
});
