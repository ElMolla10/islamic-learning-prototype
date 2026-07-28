import { describe, expect, it } from "vitest";
import { classifyPath, scanTextContent, isTextLikePath } from "../../scripts/check-private-files.mjs";

// All paths and text content below are synthetic fixtures invented for this
// test. None reference a real tracked file, a real absolute path on any
// machine, or a real secret. Do not replace these with real filenames or
// real credential-shaped strings.

describe("private-file safety scanner", () => {
  it("passes a normal sanitised learner-facing source record", () => {
    expect(classifyPath("src/content/abu_bakr/lesson_02/source_drawer.json")).toEqual([]);
  });

  it("passes a normal public image asset", () => {
    expect(classifyPath("public/icon.svg")).toEqual([]);
    expect(classifyPath("public/favicon.png")).toEqual([]);
    expect(classifyPath("public/og-image.jpg")).toEqual([]);
  });

  it("passes ordinary application source files", () => {
    for (const safe of [
      "src/app/page.tsx",
      "src/components/SourceSystem.tsx",
      "src/lib/quiz.ts",
      "package.json",
      "README.md",
      ".github/workflows/ci.yml",
    ]) {
      expect(classifyPath(safe)).toEqual([]);
    }
  });

  it("fails a PDF path", () => {
    const violations = classifyPath("content_research/example_work/synthetic-sample.pdf");
    expect(violations.length).toBeGreaterThan(0);
    expect(violations.some((v) => v.id === "path:pdf_file")).toBe(true);
  });

  it("fails an evidence-image path", () => {
    const violations = classifyPath("content_research/example_lesson/evidence_images/SPFAKE001.jpg");
    expect(violations.some((v) => v.id === "path:evidence_images")).toBe(true);
  });

  it("fails a content-draft path", () => {
    const violations = classifyPath("content_drafts/example_topic/lesson_00_example_v1/claims.json");
    expect(violations.some((v) => v.id === "path:content_drafts")).toBe(true);
    expect(violations.some((v) => v.id === "path:claims_json")).toBe(true);
  });

  it("fails a reviewer decision-form path", () => {
    const violations = classifyPath("content_drafts/example_topic/lesson_00_example_v1/mohamed_decision_form.md");
    expect(violations.some((v) => v.id === "path:decision_form")).toBe(true);
  });

  it("fails a sentence-traceability path", () => {
    const violations = classifyPath("content_drafts/example_topic/lesson_00_example_v1/sentence_traceability.json");
    expect(violations.some((v) => v.id === "path:sentence_traceability")).toBe(true);
  });

  it("fails an absolute Mac path found inside text content", () => {
    const fixtureText = '{"note": "example only: /Users/example-synthetic-user/Desktop/not-a-real-path/file.txt"}';
    const violations = scanTextContent("src/content/example/example.json", fixtureText);
    expect(violations.some((v) => v.id === "content:mac_user_path")).toBe(true);
  });

  it("fails an absolute Windows path found inside text content", () => {
    const fixtureText = 'C:\\Users\\example-synthetic-user\\Documents\\not-a-real-file.txt';
    const violations = scanTextContent("src/content/example/example.json", fixtureText);
    expect(violations.some((v) => v.id === "content:windows_user_path")).toBe(true);
  });

  it("fails text referencing the private organised-library path", () => {
    const fixtureText = "see organized_library/00_example/example-work/book.pdf for the synthetic source";
    const violations = scanTextContent("src/content/example/example.md", fixtureText);
    expect(violations.some((v) => v.id === "content:organized_library_path")).toBe(true);
  });

  it("fails text referencing an internal decision-form filename", () => {
    const fixtureText = "see mohamed_decision_form.json for the recorded (synthetic) decision";
    const violations = scanTextContent("src/content/example/example.md", fixtureText);
    expect(violations.some((v) => v.id === "content:decision_form_filename")).toBe(true);
  });

  it("does not false-positive on ordinary learner-facing vocabulary", () => {
    const fixtureText = JSON.stringify({
      lesson_id: "example.lesson_00",
      status: "internal_unapproved",
      note: "This claim is supported by the source review of the primary work.",
      sources: [{ display_title: "Example Work", author: "Example Author", claims_supported: ["CLM001"] }],
    });
    expect(scanTextContent("src/content/example/example.json", fixtureText)).toEqual([]);
  });

  it("treats only recognised text-like extensions as scannable content", () => {
    expect(isTextLikePath("src/content/example/example.json")).toBe(true);
    expect(isTextLikePath("public/photo.jpg")).toBe(false);
    expect(isTextLikePath("public/photo.png")).toBe(false);
  });

  it("exempts documentation that quotes the rule patterns as illustrative examples", () => {
    const docText = "Detects absolute paths such as /Users/example/... or C:\\Users\\example\\..., file:// URIs, and evidence_images/ references.";
    expect(scanTextContent("docs/CI.md", docText)).toEqual([]);
  });
});
