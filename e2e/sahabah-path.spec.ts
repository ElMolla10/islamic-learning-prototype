import { mkdirSync } from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ABU_BAKR_LESSON_IDENTITIES_IN_DISPLAY_ORDER } from "../src/content/abu_bakr/identity";

const output = path.resolve(process.cwd(), "../../reports/screenshots/batch8c");
test.beforeAll(() => mkdirSync(output, { recursive: true }));

const LESSON_COUNT = ABU_BAKR_LESSON_IDENTITIES_IN_DISPLAY_ORDER.length;
const lessonRoutes = ABU_BAKR_LESSON_IDENTITIES_IN_DISPLAY_ORDER.map((identity) => `/sahabah/abu-bakr/${identity.routeSlug}`);

async function clearStorage(page: import("@playwright/test").Page) {
  await page.goto("/sahabah/abu-bakr");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
}

test("all 11 Abu Bakr lesson routes render with no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("/_next/webpack-hmr")) errors.push(`${page.url()}: ${message.text()}`);
  });
  for (const route of lessonRoutes) {
    const response = await page.goto(route);
    expect(response?.ok(), route).toBeTruthy();
    await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", "block-1");
  }
  expect(errors).toEqual([]);
});

test("lesson 12 (out of range) 404s", async ({ page }) => {
  const response = await page.goto("/sahabah/abu-bakr/lesson-12");
  expect(response?.status()).toBe(404);
});

test("path overview page renders 11 chapter cards in order: Lessons 1-4 active, Lessons 5-11 in preparation", async ({ page }) => {
  await clearStorage(page);
  const allCards = page.locator(".bio-chapter-card");
  await expect(allCards).toHaveCount(LESSON_COUNT);

  const activeCards = page.locator(".path-card.active");
  await expect(activeCards).toHaveCount(4);
  await expect(activeCards.nth(0)).toHaveAttribute("href", "/sahabah/abu-bakr/lesson-1");
  await expect(activeCards.nth(1)).toHaveAttribute("href", "/sahabah/abu-bakr/lesson-2");
  await expect(activeCards.nth(2)).toHaveAttribute("href", "/sahabah/abu-bakr/lesson-3");
  await expect(activeCards.nth(3)).toHaveAttribute("href", "/sahabah/abu-bakr/lesson-4");

  const disabledCards = page.locator(".bio-chapter-card[data-disabled='true']");
  await expect(disabledCards).toHaveCount(7);
  for (let index = 0; index < 7; index += 1) {
    const card = disabledCards.nth(index);
    // Every disabled card must show the restrained "in preparation" badge, never a raw [placeholder]
    // marker or a progress-tracking status (not_started/in_progress/completed) meant for real lessons.
    await expect(card.locator(".path-card-status-badge")).toHaveText("قيد الإعداد");
    await expect(card).not.toContainText("[");
    await expect(card).not.toContainText("مبدئي");
  }
});

test("path overview shows 0 of 11 complete before any lesson is finished", async ({ page }) => {
  await clearStorage(page);
  await expect(page.locator("[data-testid='path-progress-count']")).toHaveText("0 من 11 فصولًا مكتملة");
});

test("path overview reflects a completed lesson in its per-chapter status and the path-level count", async ({ page }) => {
  await clearStorage(page);
  // Seed Lesson 1's progress directly (isolating the path-overview aggregation logic from the quiz UI,
  // which is already covered by the lesson-specific e2e suite). Lesson 1 is the only chapter whose card
  // status is progress-driven now -- Lessons 2-11 are disabled/"in preparation" regardless of any seeded
  // progress, which the second half of this test also verifies.
  await page.evaluate(() => {
    const completed = {
      version: 2,
      lessonOpened: true,
      currentBlockId: "block-10",
      visitedBlockIds: ["block-1", "block-2", "block-3", "block-4", "block-5", "block-6", "block-7", "block-8", "block-9", "block-10"],
      expandedDeepSectionIds: [],
      quizAttempts: 1,
      bestQuizScore: 1,
      quizSubmitted: true,
      quizPassed: true,
      lessonCompleted: true,
      completedLessonIds: ["abu-bakr-lesson-1"],
      preferredLanguage: "ar",
      focusMode: false,
    };
    localStorage.setItem("islamic-library-sahabah-abu-bakr-lesson-1-progress", JSON.stringify(completed));
  });
  await page.reload();
  await expect(page.locator("[data-testid='path-progress-count']")).toHaveText("1 من 11 فصولًا مكتملة");
  const firstCard = page.locator(".path-card.active").first();
  await expect(firstCard.locator(".path-card-status")).toHaveText("اكتمل الفصل");
  // A disabled/"in preparation" chapter must never show a progress-tracking status, regardless of any
  // seeded progress elsewhere (per-lesson keys stay independent of one another).
  const secondCard = page.locator(".bio-chapter-card[data-disabled='true']").first();
  await expect(secondCard.locator(".path-card-status-badge")).toHaveText("قيد الإعداد");
});

test("clicking the active chapter card navigates to the correct lesson and breadcrumb links back to the path overview", async ({ page }) => {
  await clearStorage(page);
  // Lesson 1 is currently the only active (clickable) chapter card; Lessons 2-11 are disabled/"in
  // preparation" and must not be clickable (see the dedicated placeholder-presentation test).
  await page.locator(".path-card.active").first().click();
  await expect(page).toHaveURL(/\/sahabah\/abu-bakr\/lesson-1$/);
  await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", "block-1");
  await page.locator(".bio-breadcrumbs a").nth(1).click();
  await expect(page).toHaveURL(/\/sahabah\/abu-bakr$/);
});

test("disabled/'in preparation' chapter cards are not clickable", async ({ page }) => {
  await clearStorage(page);
  const disabledCard = page.locator(".bio-chapter-card[data-disabled='true']").first();
  await expect(disabledCard).not.toHaveAttribute("href", /.+/);
  const tagName = await disabledCard.evaluate((element) => element.tagName.toLowerCase());
  expect(tagName).toBe("article");
});

test("completing lesson 2's quiz surfaces a next-chapter link to lesson 3 and a path-overview link", async ({ page }) => {
  await clearStorage(page);
  await page.goto("/sahabah/abu-bakr/lesson-2");
  // Lesson 2 has 8 real cards (L2-B01..L2-B08); the quiz lives on the 8th.
  for (let index = 0; index < 7; index += 1) await page.locator(".bio-controls").getByRole("button", { name: "التالي", exact: true }).click();
  await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", "block-8");
  const quiz = page.locator(".quiz-player");
  // Answer all 5 questions correctly (v3 adds L2Q06) so the quiz passes and the lesson completes.
  await quiz.locator('.quiz-option[data-option-id="b"] input').check(); // L2Q01
  await quiz.getByRole("button", { name: "تحقق من الإجابة", exact: true }).click();
  await quiz.locator(".quiz-navigation").getByRole("button", { name: "السؤال التالي", exact: true }).click();
  await quiz.getByLabel("خطأ", { exact: true }).check(); // L2Q02 (true_false, correct answer is false)
  await quiz.getByRole("button", { name: "تحقق من الإجابة", exact: true }).click();
  await quiz.locator(".quiz-navigation").getByRole("button", { name: "السؤال التالي", exact: true }).click();
  await quiz.locator('.quiz-option[data-option-id="a"] input').check(); // L2Q03 (select_all)
  await quiz.locator('.quiz-option[data-option-id="b"] input').check();
  await quiz.locator('.quiz-option[data-option-id="d"] input').check();
  await quiz.getByRole("button", { name: "تحقق من الإجابة", exact: true }).click();
  await quiz.locator(".quiz-navigation").getByRole("button", { name: "السؤال التالي", exact: true }).click();
  await quiz.locator('.quiz-option[data-option-id="a"] input').check(); // L2Q04
  await quiz.getByRole("button", { name: "تحقق من الإجابة", exact: true }).click();
  await quiz.locator(".quiz-navigation").getByRole("button", { name: "السؤال التالي", exact: true }).click();
  await quiz.locator('.quiz-option[data-option-id="a"] input').check(); // L2Q06 (sahih testimony, RQ03)
  await quiz.getByRole("button", { name: "تحقق من الإجابة", exact: true }).click();

  const completion = page.locator("[data-testid='lesson-completed']");
  await expect(completion).toBeVisible();
  await expect(completion.getByRole("link", { name: "الفصل التالي" })).toHaveAttribute("href", "/sahabah/abu-bakr/lesson-3");
  await expect(completion.getByRole("link", { name: "مسار السيرة الكامل" })).toHaveAttribute("href", "/sahabah/abu-bakr");
});

test("Abu Bakr path routes have no serious automated accessibility violations", async ({ page }) => {
  const routes = ["/sahabah/abu-bakr", "/sahabah/abu-bakr/lesson-2", "/sahabah/abu-bakr/lesson-11"];
  for (const route of routes) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, route).toEqual([]);
  }
});

test("capture desktop and mobile screenshots for the path overview and two lesson pages", async ({ page }) => {
  test.setTimeout(120_000);
  const routes = ["/sahabah/abu-bakr", "/sahabah/abu-bakr/lesson-3", "/sahabah/abu-bakr/lesson-11"];
  for (const width of [390, 1440] as const) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    for (const route of routes) {
      await page.goto(route);
      const name = route.replace(/\//g, "-").replace(/^-/, "");
      await page.screenshot({ path: path.join(output, `${width}-${name}.png`), fullPage: true });
    }
  }
});
