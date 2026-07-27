import { mkdirSync } from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const output = path.resolve(process.cwd(), "../../reports/screenshots/batch8c");
test.beforeAll(() => mkdirSync(output, { recursive: true }));

const LESSON_COUNT = 11;
const lessonRoutes = Array.from({ length: LESSON_COUNT }, (_, index) => `/sahabah/abu-bakr/lesson-${index + 1}`);

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

test("path overview page renders all 11 chapter cards as active links in order", async ({ page }) => {
  await clearStorage(page);
  const cards = page.locator(".path-card.active");
  await expect(cards).toHaveCount(LESSON_COUNT);
  for (let index = 0; index < LESSON_COUNT; index += 1) {
    await expect(cards.nth(index)).toHaveAttribute("href", `/sahabah/abu-bakr/lesson-${index + 1}`);
  }
  // No disabled/"planned" chapter cards should remain now that every lesson has placeholder content.
  await expect(page.locator(".path-card[data-disabled='true']")).toHaveCount(0);
});

test("path overview shows 0 of 11 complete before any lesson is finished", async ({ page }) => {
  await clearStorage(page);
  await expect(page.locator("[data-testid='path-progress-count']")).toHaveText("0 من 11 فصولًا مكتملة");
});

test("path overview reflects a completed lesson in its per-chapter status and the path-level count", async ({ page }) => {
  await clearStorage(page);
  // Seed lesson 3's progress directly (isolating the path-overview aggregation logic from the quiz UI,
  // which is already covered by the lesson-specific e2e suite for lesson 1).
  await page.evaluate(() => {
    const completed = {
      version: 2,
      lessonOpened: true,
      currentBlockId: "block-7",
      visitedBlockIds: ["block-1", "block-2", "block-3", "block-4", "block-5", "block-6", "block-7"],
      expandedDeepSectionIds: [],
      quizAttempts: 1,
      bestQuizScore: 1,
      quizSubmitted: true,
      quizPassed: true,
      lessonCompleted: true,
      completedLessonIds: ["abu-bakr-lesson-3"],
      preferredLanguage: "ar",
      focusMode: false,
    };
    localStorage.setItem("islamic-library-sahabah-abu-bakr-lesson-3-progress", JSON.stringify(completed));
  });
  await page.reload();
  await expect(page.locator("[data-testid='path-progress-count']")).toHaveText("1 من 11 فصولًا مكتملة");
  const thirdCard = page.locator(".path-card.active").nth(2);
  await expect(thirdCard.locator(".path-card-status")).toHaveText("اكتمل الفصل");
  // Every other chapter must remain unaffected (per-lesson keys stay independent of one another).
  const firstCard = page.locator(".path-card.active").nth(0);
  await expect(firstCard.locator(".path-card-status")).toHaveText("لم يبدأ");
});

test("clicking a chapter card navigates to the correct lesson and breadcrumb links back to the path overview", async ({ page }) => {
  await clearStorage(page);
  await page.locator(".path-card.active").nth(4).click();
  await expect(page).toHaveURL(/\/sahabah\/abu-bakr\/lesson-5$/);
  await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", "block-1");
  await page.locator(".bio-breadcrumbs a").nth(1).click();
  await expect(page).toHaveURL(/\/sahabah\/abu-bakr$/);
});

test("completing lesson 2's quiz surfaces a next-chapter link to lesson 3 and a path-overview link", async ({ page }) => {
  await clearStorage(page);
  await page.goto("/sahabah/abu-bakr/lesson-2");
  for (let index = 0; index < 6; index += 1) await page.locator(".bio-controls").getByRole("button", { name: "التالي", exact: true }).click();
  await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", "block-7");
  const quiz = page.locator(".quiz-player");
  await quiz.getByLabel("خيار عنصر نائب أ", { exact: true }).first().check();
  await quiz.getByRole("button", { name: "تحقق من الإجابة", exact: true }).click();
  await quiz.locator(".quiz-navigation").getByRole("button", { name: "السؤال التالي", exact: true }).click();
  await quiz.getByLabel("صحيح", { exact: true }).check();
  await quiz.getByRole("button", { name: "تحقق من الإجابة", exact: true }).click();
  await quiz.locator(".quiz-navigation").getByRole("button", { name: "السؤال التالي", exact: true }).click();
  await quiz.getByLabel("خيار عنصر نائب أ", { exact: true }).check();
  await quiz.getByLabel("خيار عنصر نائب ب", { exact: true }).check();
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

test("capture desktop and mobile screenshots for the path overview and two placeholder lesson pages", async ({ page }) => {
  test.setTimeout(120_000);
  const routes = ["/sahabah/abu-bakr", "/sahabah/abu-bakr/lesson-2", "/sahabah/abu-bakr/lesson-11"];
  for (const width of [390, 1440] as const) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    for (const route of routes) {
      await page.goto(route);
      const name = route.replace(/\//g, "-").replace(/^-/, "");
      await page.screenshot({ path: path.join(output, `${width}-${name}.png`), fullPage: true });
    }
  }
});
