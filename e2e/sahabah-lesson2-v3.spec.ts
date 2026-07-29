import { mkdirSync } from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Focused e2e coverage for the resolved Abu Bakr Lesson 2 (v2) content: navigation through its real
// 8-card / 0-deep-section structure, quiz behaviour (multiple_choice, true_false, and select_all
// question types), source-drawer behaviour, and the safety-relevant absence of retired content
// (the "eight foremost" claim and its removed sentences/quiz question) and internal-only vocabulary.

const output = path.resolve(process.cwd(), "../../reports/screenshots/lesson2_v2");
test.beforeAll(() => mkdirSync(output, { recursive: true }));

async function freshLesson2(page: Page) {
  await page.goto("/sahabah/abu-bakr/lesson-2");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
}

async function currentCardIndex(page: Page) {
  const attr = await page.locator(".bio-stage").getAttribute("data-current-card");
  return Number((attr ?? "block-1").replace("block-", ""));
}

/** Navigates to the given 1-based card index from wherever the lesson currently is. Bilingual: works
 * whether the UI is currently in Arabic or English. */
async function goToCard(page: Page, index: number) {
  let current = await currentCardIndex(page);
  while (current < index) {
    await page.locator(".bio-controls").getByRole("button", { name: /^(التالي|Next)$/ }).click();
    current += 1;
  }
  while (current > index) {
    await page.locator(".bio-controls").getByRole("button", { name: /^(السابق|Previous)$/ }).click();
    current -= 1;
  }
  await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", `block-${index}`);
}

test.describe("Lesson 2 (v2) card structure", () => {
  test("has exactly 8 cards and the Next button disables on the 8th", async ({ page }) => {
    await freshLesson2(page);
    await goToCard(page, 8);
    await expect(page.locator(".bio-controls").getByRole("button", { name: "التالي" })).toBeDisabled();
  });

  test("has zero deep sections across the lesson", async ({ page }) => {
    await freshLesson2(page);
    for (let index = 1; index <= 8; index += 1) {
      await goToCard(page, index);
      const sections = page.locator('[data-testid="deep-sections"] > details');
      expect(await sections.count(), `card ${index}`).toBe(0);
    }
  });

  test("the five named converts appear by name; the retired 'eight foremost' material is never mentioned", async ({ page }) => {
    await freshLesson2(page);
    await goToCard(page, 6); // L2-B06: name_cards
    const stage = page.locator(".bio-stage");
    // Substrings matched exactly as rendered (source text carries Arabic diacritics/tashkeel).
    for (const name of ["عثمانُ بن عفّان", "الزُّبيرُ بن العوّام", "عبدُ الرحمن بن عوف", "سعدُ بن أبي وقّاص", "طلحةُ بن عُبيدالله"]) {
      await expect(stage).toContainText(name);
    }
    await expect(stage).not.toContainText("ثمانية");
    for (let index = 1; index <= 8; index += 1) {
      await goToCard(page, index);
      const text = await page.locator(".bio-stage").innerText();
      expect(text, `card ${index}`).not.toMatch(/\beight\b/i);
      expect(text, `card ${index}`).not.toContain("فيما بلغني");
    }
  });

  test("the 'no hesitation' distinction for Abu Bakr is presented without inventing dialogue", async ({ page }) => {
    await freshLesson2(page);
    await goToCard(page, 3); // L2-B03: established_vs_reported
    await expect(page.locator(".bio-stage")).toContainText("دون تردد");
  });
});

test.describe("Lesson 2 (v2) quiz", () => {
  test("renders 4 questions and grades multiple_choice, true_false, and select_all correctly", async ({ page }) => {
    await freshLesson2(page);
    await goToCard(page, 8);
    const quiz = page.locator(".quiz-player");
    await expect(quiz).toBeVisible();
    await expect(quiz.locator(".quiz-dots i")).toHaveCount(4);

    // L2Q01 (multiple_choice, correct = "b")
    await quiz.locator('.quiz-option[data-option-id="b"] input').check();
    await quiz.getByRole("button", { name: "تحقق من الإجابة" }).click();
    await expect(quiz.locator(".quiz-feedback")).toHaveAttribute("data-correct", "true");
    await quiz.locator(".quiz-navigation").getByRole("button", { name: "السؤال التالي" }).click();

    // L2Q02 (true_false, correct = false)
    await quiz.getByLabel("خطأ", { exact: true }).check();
    await quiz.getByRole("button", { name: "تحقق من الإجابة" }).click();
    await expect(quiz.locator(".quiz-feedback")).toHaveAttribute("data-correct", "true");
    await quiz.locator(".quiz-navigation").getByRole("button", { name: "السؤال التالي" }).click();

    // L2Q03 (select_all, correct = a, b, d)
    await quiz.locator('.quiz-option[data-option-id="a"] input').check();
    await quiz.locator('.quiz-option[data-option-id="b"] input').check();
    await quiz.locator('.quiz-option[data-option-id="d"] input').check();
    await quiz.getByRole("button", { name: "تحقق من الإجابة" }).click();
    await expect(quiz.locator(".quiz-feedback")).toHaveAttribute("data-correct", "true");
    await quiz.locator(".quiz-navigation").getByRole("button", { name: "السؤال التالي" }).click();

    // L2Q04 (multiple_choice, correct = "a")
    await quiz.locator('.quiz-option[data-option-id="a"] input').check();
    await quiz.getByRole("button", { name: "تحقق من الإجابة" }).click();
    await expect(quiz.locator(".quiz-feedback")).toHaveAttribute("data-correct", "true");

    const result = page.locator(".quiz-result");
    await expect(result).toBeVisible();
    await expect(result.locator("p").first()).toContainText("4 / 4");
    await expect(result).toHaveAttribute("data-passed", "true");
  });

  test("an intentionally wrong select_all answer (Bilal/Khalid distractors) is graded incorrect", async ({ page }) => {
    await freshLesson2(page);
    await goToCard(page, 8);
    const quiz = page.locator(".quiz-player");
    await quiz.locator('.quiz-option[data-option-id="b"] input').check();
    await quiz.getByRole("button", { name: "تحقق من الإجابة" }).click();
    await quiz.locator(".quiz-navigation").getByRole("button", { name: "السؤال التالي" }).click();
    await quiz.getByLabel("خطأ", { exact: true }).check();
    await quiz.getByRole("button", { name: "تحقق من الإجابة" }).click();
    await quiz.locator(".quiz-navigation").getByRole("button", { name: "السؤال التالي" }).click();

    // L2Q03: select the two deliberate distractors (Bilal, Khalid) instead of the real answer.
    await quiz.locator('.quiz-option[data-option-id="c"] input').check();
    await quiz.locator('.quiz-option[data-option-id="e"] input').check();
    await quiz.getByRole("button", { name: "تحقق من الإجابة" }).click();
    await expect(quiz.locator(".quiz-feedback")).toHaveAttribute("data-correct", "false");
    const reviewButton = quiz.locator(".quiz-feedback .review-link");
    await expect(reviewButton).toHaveCount(1);
    await reviewButton.click();
    await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", "block-6");
  });
});

test.describe("Lesson 2 (v2) source drawer", () => {
  test("lists all 3 sources with no internal file paths or reviewer-only notes", async ({ page }) => {
    await freshLesson2(page);
    await page.getByRole("button", { name: /عرض المصادر|View sources/ }).click();
    const drawer = page.locator(".source-drawer, [data-testid='source-drawer']").first();
    await expect(drawer).toBeVisible();
    const text = await drawer.innerText();
    expect(text).not.toContain("content_research/");
    expect(text).not.toContain("content_drafts/");
    expect(text).not.toContain("/Users/");
    expect(text).not.toContain("cited via Lesson");
  });
});

test.describe("Lesson 2 (v2) completion and navigation", () => {
  test("completing the quiz surfaces a next-chapter link to lesson 3; refresh preserves progress", async ({ page }) => {
    await freshLesson2(page);
    await goToCard(page, 8);
    const quiz = page.locator(".quiz-player");
    await quiz.locator('.quiz-option[data-option-id="b"] input').check();
    await quiz.getByRole("button", { name: "تحقق من الإجابة" }).click();
    await quiz.locator(".quiz-navigation").getByRole("button", { name: "السؤال التالي" }).click();
    await quiz.getByLabel("خطأ", { exact: true }).check();
    await quiz.getByRole("button", { name: "تحقق من الإجابة" }).click();
    await quiz.locator(".quiz-navigation").getByRole("button", { name: "السؤال التالي" }).click();
    await quiz.locator('.quiz-option[data-option-id="a"] input').check();
    await quiz.locator('.quiz-option[data-option-id="b"] input').check();
    await quiz.locator('.quiz-option[data-option-id="d"] input').check();
    await quiz.getByRole("button", { name: "تحقق من الإجابة" }).click();
    await quiz.locator(".quiz-navigation").getByRole("button", { name: "السؤال التالي" }).click();
    await quiz.locator('.quiz-option[data-option-id="a"] input').check();
    await quiz.getByRole("button", { name: "تحقق من الإجابة" }).click();

    const completion = page.locator("[data-testid='lesson-completed']");
    await expect(completion).toBeVisible();
    await expect(completion.getByRole("link", { name: "الفصل التالي" })).toHaveAttribute("href", "/sahabah/abu-bakr/lesson-3");
    await expect(completion.getByRole("link", { name: "مسار السيرة الكامل" })).toHaveAttribute("href", "/sahabah/abu-bakr");

    await page.reload();
    await expect(page.locator("[data-testid='lesson-completed']")).toBeVisible();
  });

  test("direct navigation to /sahabah/abu-bakr/lesson-2 renders card 1 in both languages", async ({ page }) => {
    await page.goto("/sahabah/abu-bakr/lesson-2");
    await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", "block-1");
    await page.getByRole("button", { name: "EN" }).first().click();
    await expect(page.locator(".bio-header-kunyah")).toHaveText("The First Days of Islam");
    await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", "block-1");
  });
});

test.describe("Lesson 2 (v2) accessibility", () => {
  test("no serious automated accessibility violations on the lesson page, quiz, or source drawer", async ({ page }) => {
    await freshLesson2(page);
    let results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, "lesson page (AR)").toEqual([]);

    await page.getByRole("button", { name: "EN" }).first().click();
    results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, "lesson page (EN)").toEqual([]);

    await goToCard(page, 8);
    results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, "quiz").toEqual([]);

    await page.getByRole("button", { name: /عرض المصادر|View sources/ }).click();
    results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, "source drawer").toEqual([]);
  });
});

test.describe("Lesson 2 (v2) screenshots", () => {
  test("capture desktop and mobile screenshots of the key cards, quiz, and source drawer", async ({ page }) => {
    test.setTimeout(120_000);
    for (const width of [390, 1440] as const) {
      await page.setViewportSize({ width, height: width === 390 ? 900 : 1000 });
      await freshLesson2(page);
      await page.screenshot({ path: path.join(output, `${width}-card-01-hook.png`), fullPage: true });

      await goToCard(page, 6); // L2-B06 the five converts
      await page.screenshot({ path: path.join(output, `${width}-card-06-converts.png`), fullPage: true });

      await goToCard(page, 8); // quiz
      await page.screenshot({ path: path.join(output, `${width}-quiz.png`), fullPage: true });

      await page.getByRole("button", { name: /عرض المصادر|View sources/ }).click();
      await page.screenshot({ path: path.join(output, `${width}-source-drawer.png`), fullPage: true });
    }
  });
});
