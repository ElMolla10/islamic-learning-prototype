import { mkdirSync } from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Focused e2e coverage for the finalized Abu Bakr Lesson 2 (v3, R4.5A/R4.5B) content: navigation
// through its real 8-card / 1-deep-section structure, quiz behaviour across five questions
// (multiple_choice, true_false, and select_all question types, including the new L2Q06), source-drawer
// behaviour with five works, and the safety-relevant absence of every excluded/retired report from
// Mohamed's RQ03-RQ07 decisions (Khaythamah invitation scene, al-Waqidi Talhah narrative, the
// thirty-eight-men/khatib report, the retired "eight foremost" claim) and internal-only vocabulary.

const output = path.resolve(process.cwd(), "../../reports/screenshots/lesson2_v3");
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

/** Answers the first 4 v3 questions (L2Q01-L2Q04) with their correct options, submitting and
 * advancing after each, leaving the quiz positioned on L2Q06 for the caller to answer. */
async function answerFirstFourQuestions(quiz: ReturnType<Page["locator"]>) {
  // L2Q01 (multiple_choice, correct = "b")
  await quiz.locator('.quiz-option[data-option-id="b"] input').check();
  await quiz.getByRole("button", { name: "تحقق من الإجابة" }).click();
  await quiz.locator(".quiz-navigation").getByRole("button", { name: "السؤال التالي" }).click();

  // L2Q02 (true_false, correct = false)
  await quiz.getByLabel("خطأ", { exact: true }).check();
  await quiz.getByRole("button", { name: "تحقق من الإجابة" }).click();
  await quiz.locator(".quiz-navigation").getByRole("button", { name: "السؤال التالي" }).click();

  // L2Q03 (select_all, correct = a, b, d)
  await quiz.locator('.quiz-option[data-option-id="a"] input').check();
  await quiz.locator('.quiz-option[data-option-id="b"] input').check();
  await quiz.locator('.quiz-option[data-option-id="d"] input').check();
  await quiz.getByRole("button", { name: "تحقق من الإجابة" }).click();
  await quiz.locator(".quiz-navigation").getByRole("button", { name: "السؤال التالي" }).click();

  // L2Q04 (multiple_choice, correct = "a")
  await quiz.locator('.quiz-option[data-option-id="a"] input').check();
  await quiz.getByRole("button", { name: "تحقق من الإجابة" }).click();
  await quiz.locator(".quiz-navigation").getByRole("button", { name: "السؤال التالي" }).click();
}

test.describe("Lesson 2 (v3) card structure", () => {
  test("has exactly 8 cards and the Next button disables on the 8th", async ({ page }) => {
    await freshLesson2(page);
    await goToCard(page, 8);
    await expect(page.locator(".bio-controls").getByRole("button", { name: "التالي" })).toBeDisabled();
  });

  test("has exactly one deep section, on card 6 (the clans derivation)", async ({ page }) => {
    await freshLesson2(page);
    let total = 0;
    for (let index = 1; index <= 8; index += 1) {
      await goToCard(page, index);
      const sections = page.locator('[data-testid="deep-sections"] > details');
      const count = await sections.count();
      total += count;
      if (index === 6) {
        expect(count, "card 6 should carry the one clans deep section").toBe(1);
      } else {
        expect(count, `card ${index}`).toBe(0);
      }
    }
    expect(total).toBe(1);
  });

  test("the five named converts appear by name; retired/excluded material is never mentioned", async ({ page }) => {
    await freshLesson2(page);
    await goToCard(page, 6); // L2-B06: name_cards
    const stage = page.locator(".bio-stage");
    for (const name of ["عثمانُ بن عفّان", "الزُّبيرُ بن العوّام", "عبدُ الرحمن بن عوف", "سعدُ بن أبي وقّاص", "طلحةُ بن عُبيدالله"]) {
      await expect(stage).toContainText(name);
    }
    await expect(stage).not.toContainText("ثمانية");
    for (let index = 1; index <= 8; index += 1) {
      await goToCard(page, index);
      const text = await page.locator(".bio-stage").innerText();
      expect(text, `card ${index}`).not.toMatch(/\beight\b/i);
      expect(text, `card ${index}`).not.toContain("فيما بلغني");
      expect(text, `card ${index}`).not.toContain("خيثمة");
      expect(text, `card ${index}`).not.toContain("الأخشب");
      expect(text, `card ${index}`).not.toMatch(/واقدي|بُصرى/);
      expect(text, `card ${index}`).not.toMatch(/thirty-eight/i);
      expect(text, `card ${index}`).not.toMatch(/\bkhatib\b/i);
      expect(text, `card ${index}`).not.toContain("خطيب");
    }
  });

  test("B03 (key_evidence) renders all three items: the no-hesitation report, the explanation, and the amended sahih testimony", async ({ page }) => {
    await freshLesson2(page);
    await goToCard(page, 3); // L2-B03: key_evidence (R4.5B fix -- established_vs_reported only ever
    // rendered items[0]/items[1] and silently dropped this card's third item once RQ03 grew it to 3).
    const stage = page.locator(".bio-stage");
    // Item 1: the "no hesitation" Seerah quotation.
    await expect(stage).toContainText("دون تردد");
    // Item 2: the explanation (RQ05 fallback wording, friendship dependency removed).
    await expect(stage).toContainText("فقَبولُ هذا الدين يومئذ خروجٌ عن دين الآباء");
    // Item 3: the amended sahih testimony (RQ03) -- this is exactly the item the old block type dropped.
    await expect(stage).toContainText("وبعد سنين"); // the amended "years later" framing (RQ03)
    await expect(stage).toContainText("وواساني بنفسِه ومالِه");
    await expect(stage).not.toContainText("قال يوماً");
    const text = await stage.innerText();
    expect(text).not.toMatch(/everyone else opposed|كل من عارضه/i);
  });

  test("B04 keeps Ibn al-Daghinah's authenticated character description (RQ04) with corrected wording", async ({ page }) => {
    await freshLesson2(page);
    await goToCard(page, 4);
    const stage = page.locator(".bio-stage");
    await expect(stage).toContainText("ابنُ الدَّغِنَة");
    await expect(stage).not.toContainText("ائتمنه قومُه على أموالهم وأنسابهم");
  });

  test("B06 explicitly attributes presenting Islam and reciting the Qur'an to the Messenger of Allah ﷺ", async ({ page }) => {
    await freshLesson2(page);
    await goToCard(page, 6);
    await expect(page.locator(".bio-stage")).toContainText("فعرَض عليهم رسولُ اللهِ ﷺ الإسلامَ");
  });

  test("B06 (name_cards) renders as plain sequential paragraphs in both languages, never split into broken 'Name N' cards", async ({ page }) => {
    // Regression test: the shared NameCards component (LessonBlocks.tsx) treats a block as a
    // name-card set when its first 3 items each contain exactly one " — " em-dash. An earlier
    // English wording of item 2 accidentally introduced a dash the Arabic never had, so English
    // alone silently rendered as three broken "Name 1/2/3" cards splitting mid-sentence.
    await freshLesson2(page);
    await goToCard(page, 6);
    await expect(page.locator(".bio-stage .name-grid")).toHaveCount(0);
    await expect(page.locator(".bio-stage")).not.toContainText("Name 1");
    await expect(page.locator(".bio-stage")).not.toContainText("Name 2");

    await page.getByRole("button", { name: "EN" }).first().click();
    await expect(page.locator(".bio-stage .name-grid")).toHaveCount(0);
    await expect(page.locator(".bio-stage")).not.toContainText("Name 1");
    await expect(page.locator(".bio-stage")).not.toContainText("Name 2");
    await expect(page.locator(".bio-stage")).toContainText("The Messenger of Allah ﷺ then presented Islam to them, recited the Qur'an to them, told them of the truth of Islam, and they believed and prayed.");
  });

  test("B06 states precisely 'four different clans', never a five-clans reading", async ({ page }) => {
    await freshLesson2(page);
    await goToCard(page, 6);
    const stage = page.locator(".bio-stage");
    await expect(stage).toContainText("أربعة بطونٍ مختلفة");
    const text = await stage.innerText();
    expect(text).not.toContain("بطونٍ متفرقةٍ");
    await expect(page.locator('[data-testid="deep-sections"] summary').first()).toBeVisible();
  });
});

test.describe("Lesson 2 (v3) quiz", () => {
  test("renders 5 questions and grades all question types correctly, including L2Q06", async ({ page }) => {
    await freshLesson2(page);
    await goToCard(page, 8);
    const quiz = page.locator(".quiz-player");
    await expect(quiz).toBeVisible();
    await expect(quiz.locator(".quiz-dots i")).toHaveCount(5);

    await answerFirstFourQuestions(quiz);

    // L2Q06 (multiple_choice, correct = "a": "he said 'he spoke the truth', and stood by him with himself and his wealth")
    await expect(quiz.locator("h3")).toContainText("كذّبه الناس");
    await quiz.locator('.quiz-option[data-option-id="a"] input').check();
    await quiz.getByRole("button", { name: "تحقق من الإجابة" }).click();
    await expect(quiz.locator(".quiz-feedback")).toHaveAttribute("data-correct", "true");

    const result = page.locator(".quiz-result");
    await expect(result).toBeVisible();
    await expect(result.locator("p").first()).toContainText("5 / 5");
    await expect(result).toHaveAttribute("data-passed", "true");
  });

  test("an intentionally wrong select_all answer (Bilal/Khalid distractors) is graded incorrect and reviews to card 6", async ({ page }) => {
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

  test("an intentionally wrong L2Q06 answer reviews back to card 3 (the sahih testimony)", async ({ page }) => {
    await freshLesson2(page);
    await goToCard(page, 8);
    const quiz = page.locator(".quiz-player");
    await answerFirstFourQuestions(quiz);
    await quiz.locator('.quiz-option[data-option-id="b"] input').check(); // wrong: "hesitated at first"
    await quiz.getByRole("button", { name: "تحقق من الإجابة" }).click();
    await expect(quiz.locator(".quiz-feedback")).toHaveAttribute("data-correct", "false");
    const reviewButton = quiz.locator(".quiz-feedback .review-link");
    await expect(reviewButton).toHaveCount(1);
    await reviewButton.click();
    await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", "block-3");
  });
});

test.describe("Lesson 2 (v3) source drawer", () => {
  test("lists all 5 sources with no internal file paths, reviewer-only notes, or pages 228/229", async ({ page }) => {
    await freshLesson2(page);
    await page.getByRole("button", { name: /عرض المصادر|View sources/ }).click();
    const drawer = page.locator(".source-drawer, [data-testid='source-drawer']").first();
    await expect(drawer).toBeVisible();
    const text = await drawer.innerText();
    expect(text).not.toContain("content_research/");
    expect(text).not.toContain("content_drafts/");
    expect(text).not.toContain("/Users/");
    expect(text).not.toContain("cited via Lesson");
    expect(text).not.toMatch(/\b228\b|\b229\b/);
    const showMore = drawer.getByRole("button", { name: "عرض بقية المصادر" });
    if (await showMore.count()) await showMore.click();
    await expect(drawer).toContainText("صحيح البخاري");
    await expect(drawer).toContainText("البداية والنهاية");
  });
});

test.describe("Lesson 2 (v3) completion and navigation", () => {
  test("completing all 5 questions surfaces a next-chapter link to lesson 3; refresh preserves progress", async ({ page }) => {
    await freshLesson2(page);
    await goToCard(page, 8);
    const quiz = page.locator(".quiz-player");
    await answerFirstFourQuestions(quiz);
    await quiz.locator('.quiz-option[data-option-id="a"] input').check();
    await quiz.getByRole("button", { name: "تحقق من الإجابة" }).click();

    const completion = page.locator("[data-testid='lesson-completed']");
    await expect(completion).toBeVisible();
    await expect(completion.getByRole("link", { name: "الفصل التالي" })).toHaveAttribute("href", "/sahabah/abu-bakr/lesson-3");
    await expect(completion.getByRole("link", { name: "مسار السيرة الكامل" })).toHaveAttribute("href", "/sahabah/abu-bakr");

    await page.reload();
    await expect(page.locator("[data-testid='lesson-completed']")).toBeVisible();
  });

  test("a learner who already passed v2's 4-question quiz keeps lessonCompleted true after the v3 upgrade (progress compatibility)", async ({ page }) => {
    await page.goto("/sahabah/abu-bakr/lesson-2");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      const completed = {
        version: 2,
        lessonOpened: true,
        currentBlockId: "block-8",
        visitedBlockIds: ["block-1", "block-2", "block-3", "block-4", "block-5", "block-6", "block-7", "block-8"],
        expandedDeepSectionIds: [],
        quizAttempts: 1,
        bestQuizScore: 1,
        quizSubmitted: true,
        quizPassed: true,
        lessonCompleted: true,
        completedLessonIds: ["abu-bakr-lesson-2"],
        preferredLanguage: "ar",
        focusMode: false,
      };
      localStorage.setItem("islamic-library-sahabah-abu-bakr-lesson-2-progress", JSON.stringify(completed));
    });
    await page.reload();
    await expect(page.locator("[data-testid='lesson-completed']")).toBeVisible();
    await page.goto("/sahabah/abu-bakr");
    const firstCard = page.locator(".path-card.active").nth(1);
    await expect(firstCard.locator(".path-card-status")).toHaveText("اكتمل الفصل");
  });

  test("direct navigation to /sahabah/abu-bakr/lesson-2 renders card 1 in both languages", async ({ page }) => {
    await page.goto("/sahabah/abu-bakr/lesson-2");
    await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", "block-1");
    await page.getByRole("button", { name: "EN" }).first().click();
    await expect(page.locator(".bio-header-kunyah")).toHaveText("The First Days of Islam");
    await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", "block-1");
  });
});

test.describe("Lesson 2 (v3) accessibility", () => {
  test("no serious automated accessibility violations on the lesson page, quiz, deep section, or source drawer", async ({ page }) => {
    await freshLesson2(page);
    let results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, "lesson page (AR)").toEqual([]);

    await page.getByRole("button", { name: "EN" }).first().click();
    results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, "lesson page (EN)").toEqual([]);

    await goToCard(page, 6);
    await page.locator('[data-testid="deep-sections"] summary').first().click();
    results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, "card 6 with deep section open").toEqual([]);

    await goToCard(page, 8);
    results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, "quiz").toEqual([]);

    await page.getByRole("button", { name: /عرض المصادر|View sources/ }).click();
    results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, "source drawer").toEqual([]);
  });
});

test.describe("Lesson 2 (v3) screenshots", () => {
  test("capture desktop and mobile screenshots of the key cards, deep section, quiz, and source drawer", async ({ page }) => {
    test.setTimeout(120_000);
    for (const width of [390, 1440] as const) {
      await page.setViewportSize({ width, height: width === 390 ? 900 : 1000 });
      await freshLesson2(page);
      await page.screenshot({ path: path.join(output, `${width}-card-01-hook.png`), fullPage: true });

      await goToCard(page, 6); // L2-B06 the five converts
      await page.screenshot({ path: path.join(output, `${width}-card-06-converts.png`), fullPage: true });
      await page.locator('[data-testid="deep-sections"] summary').first().click();
      await page.screenshot({ path: path.join(output, `${width}-card-06-clans-deep.png`), fullPage: true });

      await goToCard(page, 8); // quiz
      await page.screenshot({ path: path.join(output, `${width}-quiz.png`), fullPage: true });

      await page.getByRole("button", { name: /عرض المصادر|View sources/ }).click();
      await page.screenshot({ path: path.join(output, `${width}-source-drawer.png`), fullPage: true });
    }
  });
});
