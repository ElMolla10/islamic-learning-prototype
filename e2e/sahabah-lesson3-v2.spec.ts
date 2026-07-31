import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const ROUTE = "/sahabah/abu-bakr/lesson-3";
const PROGRESS_KEY = "islamic-library-sahabah-abu-bakr-lesson-3-progress";
const QUIZ_KEY = "islamic-library-sahabah-abu-bakr-lesson-3-quiz";

async function freshLesson3(page: Page) {
  await page.goto(ROUTE);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", "block-1");
}

async function currentCardIndex(page: Page) {
  const value = await page.locator(".bio-stage").getAttribute("data-current-card");
  return Number((value ?? "block-1").replace("block-", ""));
}

async function goToCard(page: Page, target: number) {
  let current = await currentCardIndex(page);
  while (current < target) {
    await page.locator(".bio-controls").getByRole("button", { name: /^(التالي|Next)$/ }).click();
    current += 1;
  }
  while (current > target) {
    await page.locator(".bio-controls").getByRole("button", { name: /^(السابق|Previous)$/ }).click();
    current -= 1;
  }
  await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", `block-${target}`);
}

async function answerAllSixCorrectly(page: Page) {
  const quiz = page.locator(".quiz-player");
  await expect(quiz.locator(".quiz-dots i")).toHaveCount(6);
  for (let question = 1; question <= 6; question += 1) {
    await quiz.locator('.quiz-option[data-option-id="a"] input').check();
    await quiz.getByRole("button", { name: /^(تحقق من الإجابة|Check answer)$/ }).click();
    if (question < 6) {
      await quiz.locator(".quiz-navigation").getByRole("button", { name: /^(السؤال التالي|Next Question)$/ }).click();
    }
  }
}

test("Lesson 3 renders the approved nine-card bilingual package and one deep section", async ({ page }) => {
  await freshLesson3(page);
  await expect(page.locator(".bio-header-kunyah")).toHaveText("الإيمان تحت الاضطهاد");
  await expect(page.locator(".bio-header-titles, .bio-header-dates")).toHaveCount(0);

  let deepSections = 0;
  let allText = "";
  for (let card = 1; card <= 9; card += 1) {
    await goToCard(page, card);
    allText += ` ${await page.locator(".bio-stage").innerText()}`;
    deepSections += await page.locator('[data-testid="deep-sections"] > details').count();
  }
  expect(deepSections).toBe(1);
  expect(allText).toContain("برك الغماد");
  expect(allText).not.toMatch(/PLACEHOLDER|عنصر نائب|ثمانية وثلاثين|أول خطيب|دار أبي الأرقم|أم الخير/iu);

  await page.getByRole("button", { name: "EN" }).first().click();
  await expect(page.locator(".bio-header-kunyah")).toHaveText("Faith Under Persecution");
  await goToCard(page, 5);
  await expect(page.locator(".bio-stage")).toContainText("Bark al-Ghimad");
  await expect(page.locator(".bio-stage")).not.toContainText("Barq al-Ghimad");
  await goToCard(page, 4);
  const deep = page.locator('[data-testid="deep-sections"] > details');
  await expect(deep).toHaveCount(1);
  await deep.locator("summary").click();
  await expect(deep).toContainText("From Denial to Freedom and Choice");
});

test("Lesson 3 source drawer exposes only three approved works", async ({ page }) => {
  await freshLesson3(page);
  await page.getByRole("button", { name: "عرض المصادر (3)" }).click();
  const drawer = page.locator(".source-drawer");
  await expect(drawer).toBeVisible();
  await expect(drawer.locator(".source-item")).toHaveCount(3);
  await expect(drawer).toContainText("صحيح البخاري");
  await expect(drawer).toContainText("فضائل الصحابة");
  await expect(drawer).toContainText("السيرة النبوية لابن هشام");
  const text = await drawer.innerText();
  expect(text).not.toMatch(/L3-SP|AB-L3-C|internal_passage|reviewer|Gate [AP]|\/Users\//i);
});

test("Lesson 3 progress and quiz restore through the unchanged legacy keys", async ({ page }) => {
  await freshLesson3(page);
  await goToCard(page, 4);
  await page.waitForFunction(
    ({ key }) => JSON.parse(localStorage.getItem(key) ?? "{}").currentBlockId === "block-4",
    { key: PROGRESS_KEY },
  );
  await page.reload();
  await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", "block-4");

  await goToCard(page, 9);
  const quiz = page.locator(".quiz-player");
  await quiz.locator('.quiz-option[data-option-id="a"] input').check();
  await quiz.getByRole("button", { name: "تحقق من الإجابة" }).click();
  await quiz.locator(".quiz-navigation").getByRole("button", { name: "السؤال التالي" }).click();
  await page.waitForFunction(
    ({ key }) => JSON.parse(sessionStorage.getItem(key) ?? "{}").current === 1,
    { key: QUIZ_KEY },
  );
  await page.reload();
  await expect(page.locator(".question-count")).toHaveText("السؤال 2 من 6");
});

test("completing Lesson 3 records its legacy ID and links explicitly to Lesson 4", async ({ page }) => {
  await freshLesson3(page);
  await goToCard(page, 9);
  await answerAllSixCorrectly(page);

  const completion = page.locator("[data-testid='lesson-completed']");
  await expect(completion).toBeVisible();
  await expect(completion.getByRole("link", { name: "الفصل التالي" })).toHaveAttribute("href", "/sahabah/abu-bakr/lesson-4");
  await page.waitForFunction(
    ({ key }) => {
      const progress = JSON.parse(localStorage.getItem(key) ?? "{}");
      return progress.lessonCompleted === true && progress.completedLessonIds?.includes("abu-bakr-lesson-3");
    },
    { key: PROGRESS_KEY },
  );
  await page.reload();
  await expect(page.locator("[data-testid='lesson-completed']")).toBeVisible();
});

test("the path exposes Chapters 1–3 and keeps Chapters 4–11 planned", async ({ page }) => {
  await page.goto("/sahabah/abu-bakr");
  const active = page.locator(".path-card.active");
  await expect(active).toHaveCount(3);
  await expect(active.nth(0)).toHaveAttribute("href", "/sahabah/abu-bakr/lesson-1");
  await expect(active.nth(1)).toHaveAttribute("href", "/sahabah/abu-bakr/lesson-2");
  await expect(active.nth(2)).toHaveAttribute("href", ROUTE);
  await expect(active.nth(2)).toContainText("الإيمان تحت الاضطهاد");
  await expect(active.nth(2).locator('[data-state="in-preparation"]')).toHaveCount(0);
  await expect(page.locator('.path-card[data-disabled="true"]')).toHaveCount(8);
  await expect(page.locator(".bio-companion-hero")).toContainText("الفصول الثلاثة الأولى");
});

test("Lesson 3 is accessible in both directions and sends no analytics, CAPTCHA, or Formspree request", async ({ page }) => {
  const prohibitedRequests: string[] = [];
  page.on("request", (request) => {
    if (/formspree|recaptcha|hcaptcha|turnstile|analytics|\/api\/feedback/i.test(request.url())) {
      prohibitedRequests.push(request.url());
    }
  });

  await freshLesson3(page);
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, "Arabic card 1").toEqual([]);
  await page.getByRole("button", { name: "EN" }).first().click();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, "English card 1").toEqual([]);

  await page.setViewportSize({ width: 390, height: 844 });
  await goToCard(page, 4);
  await page.locator('[data-testid="deep-sections"] summary').click();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, "mobile deep section").toEqual([]);
  await page.getByRole("button", { name: "View sources (3)" }).click();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, "mobile source drawer").toEqual([]);
  expect(prohibitedRequests).toEqual([]);
});
