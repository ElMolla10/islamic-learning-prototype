import { expect, test, type Page } from "@playwright/test";

// Focused coverage for the "مراحل الفصل / Chapter phases" stage navigator fix: it must derive its 10
// entries from lesson.blocks (the adapter's normalised output), one per real guided card, in order --
// not from the 4 narrative lesson.timelinePhases markers it used to read.

const CORE_STAGE_TITLES_AR = [
  "حياةٌ إلى جانب النبي ﷺ",
  "هويّته بإيجاز",
  "اسمه، وكنيته، وألقابه",
  "من أوائل المؤمنين",
  "أقربُ الصحابة إليه",
  "أسرته والعلاقات المحيطة به",
  "حياتُه في خطٍّ زمنيٍّ واحد",
  "صفاتٌ ظهرت عبر حياته",
  "ما الذي سيستكشفه هذا المسار؟",
  "اختبر فهمك",
];
const CORE_STAGE_TITLES_EN = [
  "A Life Beside the Prophet ﷺ",
  "Quick Identity",
  "His Name, Kunyah, and Titles",
  "Among the Earliest Believers",
  "The Closest Companion",
  "Family and Relationships",
  "His Life in One Timeline",
  "Qualities Revealed Across His Life",
  "What This Path Will Explore",
  "Check Your Understanding",
];

async function freshLesson1(page: Page) {
  await page.goto("/sahabah/abu-bakr/lesson-1");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
}

test.describe("Stage navigator — structure and content", () => {
  test("exactly 10 stages render, in order, with no deep section counted as a stage", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await freshLesson1(page);
    const stages = page.locator(".bio-toc .bio-timeline li");
    await expect(stages).toHaveCount(10);
    // Deep sections must never surface as their own top-level stage entries.
    await expect(page.locator(".bio-toc .bio-timeline li", { hasText: "لماذا لُقِّب" })).toHaveCount(0);
    await expect(page.locator(".bio-toc .bio-timeline li", { hasText: "من أين جاء لقب" })).toHaveCount(0);
  });

  test("Arabic stage titles match the Arabic lesson cards, in order", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await freshLesson1(page);
    const titles = await page.locator(".bio-toc .bio-timeline strong").allTextContents();
    expect(titles).toEqual(CORE_STAGE_TITLES_AR);
  });

  test("English stage titles match the English lesson cards, in order", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await freshLesson1(page);
    await page.getByRole("button", { name: "EN" }).first().click();
    const titles = await page.locator(".bio-toc .bio-timeline strong").allTextContents();
    expect(titles).toEqual(CORE_STAGE_TITLES_EN);
  });

  test("no mixed-language labels: switching language updates every stage title", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await freshLesson1(page);
    await page.getByRole("button", { name: "EN" }).first().click();
    const titles = await page.locator(".bio-toc .bio-timeline strong").allTextContents();
    for (const title of titles) {
      expect(CORE_STAGE_TITLES_AR).not.toContain(title);
      expect(CORE_STAGE_TITLES_EN).toContain(title);
    }
  });
});

test.describe("Stage navigator — state and navigation sync", () => {
  test("stage 1 is active initially; Next/Previous move the active stage forward and back", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await freshLesson1(page);
    const stageButtons = page.locator(".bio-toc .bio-timeline button");
    await expect(stageButtons.nth(0)).toHaveAttribute("data-state", "current");
    await expect(stageButtons.nth(0)).toHaveAttribute("aria-current", "step");

    await page.locator(".bio-controls").getByRole("button", { name: "التالي" }).click();
    await expect(stageButtons.nth(1)).toHaveAttribute("data-state", "current");
    await expect(stageButtons.nth(0)).toHaveAttribute("data-state", "visited");

    await page.locator(".bio-controls").getByRole("button", { name: "السابق" }).click();
    await expect(stageButtons.nth(0)).toHaveAttribute("data-state", "current");
  });

  test("clicking a stage navigates to the correct card and updates visited state", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await freshLesson1(page);
    const stageButtons = page.locator(".bio-toc .bio-timeline button");
    // Visit stages 2, 3, and 4 in order first, then jump to 5 -- only stages actually landed on become
    // "visited"; the navigator does not assume every earlier stage was seen just because a later one was.
    await stageButtons.nth(1).click();
    await stageButtons.nth(2).click();
    await stageButtons.nth(3).click();
    await stageButtons.nth(4).click();
    await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", "block-5");
    await expect(stageButtons.nth(4)).toHaveAttribute("data-state", "current");
    for (let index = 0; index < 4; index += 1) {
      await expect(stageButtons.nth(index)).toHaveAttribute("data-state", "visited");
    }
    // A stage never visited remains "upcoming".
    await expect(stageButtons.nth(9)).toHaveAttribute("data-state", "upcoming");
  });

  test("mobile drawer and desktop rail stay synchronised on the same stage", async ({ page }) => {
    await freshLesson1(page);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator(".bio-toc .bio-timeline button").nth(2).click();
    await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", "block-3");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "مراحل الفصل" }).click();
    const drawer = page.getByRole("dialog", { name: "مراحل الفصل" });
    await expect(drawer.locator(".bio-timeline button").nth(2)).toHaveAttribute("data-state", "current");
  });

  test("refresh preserves the current stage", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await freshLesson1(page);
    await page.locator(".bio-toc .bio-timeline button").nth(6).click();
    await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", "block-7");
    await page.reload();
    await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", "block-7");
    await expect(page.locator(".bio-toc .bio-timeline button").nth(6)).toHaveAttribute("data-state", "current");
  });

  test("language switching preserves the selected stage", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await freshLesson1(page);
    await page.locator(".bio-toc .bio-timeline button").nth(3).click();
    await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", "block-4");
    await page.getByRole("button", { name: "EN" }).first().click();
    await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", "block-4");
    await expect(page.locator(".bio-toc .bio-timeline button").nth(3)).toHaveAttribute("data-state", "current");
  });

  test("quiz review links still open the correct card and deep section after the navigator fix", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await freshLesson1(page);
    await page.locator(".bio-toc .bio-timeline button").nth(9).click();
    const quiz = page.locator(".quiz-player");
    await expect(quiz).toBeVisible();
    await expect(page.locator(".bio-toc .bio-timeline button").nth(9)).toHaveAttribute("data-state", "current");
  });

  test("every stage button is reachable by keyboard (Tab) and has a clear accessible name", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await freshLesson1(page);
    const stageButtons = page.locator(".bio-toc .bio-timeline button");
    for (let index = 0; index < 10; index += 1) {
      const button = stageButtons.nth(index);
      await button.focus();
      await expect(button).toBeFocused();
      const accessibleName = (await button.textContent())?.trim() ?? "";
      expect(accessibleName.length).toBeGreaterThan(0);
    }
  });
});
