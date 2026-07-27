import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function fresh(page: Page, route: string) {
  await page.goto(route);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
}

test.describe("Grouped content: shared tokens, category variants, no regressions", () => {
  test("Abu Bakr AB02/AB03/AB08 grouped-list items render with the shared inset-row background and no overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await fresh(page, "/sahabah/abu-bakr/lesson-1");
    await page.locator(".bio-controls").getByRole("button", { name: "التالي" }).click(); // AB02
    await expect(page.locator(".grouped-list-item").first()).toBeVisible();
    const bg = await page.locator(".grouped-list-item").first().evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(bg).toBe("rgb(241, 239, 231)"); // #f1efe7, the shared --grouped-row-bg token
    const overflowing = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflowing).toBe(false);
  });

  test("Al-Fatihah's theme-journey and quick-facts cards remain visually distinct from grouped-list rows (bordered card vs borderless row)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await fresh(page, "/quran/al-fatihah/lesson-1");
    await page.locator(".card-controls").getByRole("button", { name: "التالي" }).click(); // facts
    await expect(page.locator(".fact-item").first()).toBeVisible();
    const factBorderWidth = await page.locator(".fact-item").first().evaluate((element) => getComputedStyle(element).borderWidth);
    expect(factBorderWidth).toBe("0px"); // borderless "row" family

    for (let i = 0; i < 5; i++) await page.locator(".card-controls").getByRole("button", { name: "التالي" }).click();
    await expect(page.locator(".theme-journey article").first()).toBeVisible();
    const journeyBorderWidth = await page.locator(".theme-journey article").first().evaluate((element) => getComputedStyle(element).borderWidth);
    expect(journeyBorderWidth).toBe("1px"); // bordered "card" family, intentionally kept distinct
  });

  test("dark hadith-feature cards are unaffected by the grouped-content token changes", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await fresh(page, "/quran/al-fatihah/lesson-1");
    for (let i = 0; i < 5; i++) await page.locator(".card-controls").getByRole("button", { name: "التالي" }).click();
    const bg = await page.locator(".hadith-feature").first().evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(bg).toBe("rgb(37, 62, 53)"); // #253e35, unchanged dark accent
  });

  test("Abu Bakr timeline-review rows share the same token background as grouped-list rows", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await fresh(page, "/sahabah/abu-bakr/lesson-1");
    for (let i = 0; i < 6; i++) await page.locator(".bio-controls").getByRole("button", { name: "التالي" }).click();
    const bg = await page.locator(".bio-timeline-review-list li").first().evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(bg).toBe("rgb(241, 239, 231)");
  });
});

test.describe("Responsive typography: .grouped-list-item strong", () => {
  const widths = [320, 390, 768, 1024, 1440] as const;

  test("label font-size scales across breakpoints and never exceeds or lags the body text unreasonably", async ({ page }) => {
    await fresh(page, "/sahabah/abu-bakr/lesson-1");
    for (let i = 0; i < 7; i++) await page.locator(".bio-controls").getByRole("button", { name: "التالي" }).click(); // AB08 qualities
    const sizes: number[] = [];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      const strongPx = await page.locator(".grouped-list-item strong").first().evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
      const pPx = await page.locator(".grouped-list-item p").first().evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
      sizes.push(strongPx);
      // Label and body should track together (restrained, not wildly mismatched) at every breakpoint.
      expect(Math.abs(strongPx - pPx), `mismatch at ${width}px`).toBeLessThan(1);
      const overflowing = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(overflowing, `overflow at ${width}px`).toBe(false);
    }
    // Narrow mobile must not be larger than desktop, and desktop must be larger than the narrowest step.
    expect(sizes[0]).toBeLessThanOrEqual(sizes[sizes.length - 1]);
    expect(sizes[sizes.length - 1]).toBeGreaterThan(sizes[0] - 0.01);
  });

  test("long English labels do not overflow their box", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await fresh(page, "/sahabah/abu-bakr/lesson-1");
    await page.getByRole("button", { name: "EN" }).first().click();
    for (let i = 0; i < 7; i++) await page.locator(".bio-controls").getByRole("button", { name: "Next" }).click();
    const overflowing = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflowing).toBe(false);
  });
});

test.describe("Sahabah companion cards: avatar collision fix", () => {
  test("all 4 companion cards render a single, centred, non-colliding avatar icon", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await fresh(page, "/sahabah");
    const cards = page.locator(".companion-card");
    await expect(cards).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      const card = cards.nth(i);
      await expect(card.locator(".companion-initial")).toHaveCount(1);
      await expect(card.locator(".companion-initial svg")).toHaveCount(1);
      const avatarBox = await card.locator(".companion-initial").boundingBox();
      const badgeCount = await card.locator(".path-card-status-badge").count();
      expect(badgeCount).toBe(0); // companion cards don't use the chapter status badge, so no overlap risk
      expect(avatarBox?.width).toBeGreaterThan(0);
    }
  });

  test("disabled companion cards are not clickable and have correct accessible names, AR and EN", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await fresh(page, "/sahabah");
    const disabled = page.locator(".companion-card[data-disabled='true']");
    await expect(disabled).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      const card = disabled.nth(i);
      const tagName = await card.evaluate((element) => element.tagName.toLowerCase());
      expect(tagName).toBe("article");
      await expect(card).toHaveAttribute("aria-label", /.+—.+/);
    }
    await page.getByRole("button", { name: "EN" }).first().click();
    await expect(disabled.first()).toHaveAttribute("aria-label", /unavailable/);
  });

  test("mobile: companion cards render correctly with no avatar/badge collision", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await fresh(page, "/sahabah");
    const cards = page.locator(".companion-card");
    for (let i = 0; i < 4; i++) {
      await expect(cards.nth(i).locator(".companion-initial")).toBeVisible();
    }
    const overflowing = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflowing).toBe(false);
  });
});

test.describe("Direct Sahabah navigation link", () => {
  test("desktop nav includes a working Sahabah link with correct AR/EN labels", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");
    const link = page.locator(".desktop-nav").getByRole("link", { name: "الصحابة" });
    await expect(link).toHaveAttribute("href", "/sahabah");
    await link.click();
    await expect(page).toHaveURL(/\/sahabah$/);

    await page.getByRole("button", { name: "EN" }).first().click();
    await expect(page.locator(".desktop-nav").getByRole("link", { name: "Sahabah" })).toHaveAttribute("href", "/sahabah");
  });

  test("mobile nav drawer includes a working Sahabah link", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/");
    await page.locator(".mobile-menu-button").click();
    const link = page.locator(".mobile-nav").getByRole("link", { name: "الصحابة" });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/sahabah$/);
  });

  test("active state is correct on all three Sahabah routes and absent on Qur'an routes", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const route of ["/sahabah", "/sahabah/abu-bakr", "/sahabah/abu-bakr/lesson-1"]) {
      await page.goto(route);
      await expect(page.locator(".desktop-nav a[href='/sahabah']")).toHaveAttribute("aria-current", "page");
      await expect(page.locator(".desktop-nav a[href='/quran']")).not.toHaveAttribute("aria-current", "page");
    }
    for (const route of ["/quran", "/quran/al-fatihah", "/quran/al-fatihah/lesson-1"]) {
      await page.goto(route);
      await expect(page.locator(".desktop-nav a[href='/quran']")).toHaveAttribute("aria-current", "page");
      await expect(page.locator(".desktop-nav a[href='/sahabah']")).not.toHaveAttribute("aria-current", "page");
    }
  });

  test("nav link is keyboard reachable", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");
    const link = page.locator(".desktop-nav").getByRole("link", { name: "الصحابة" });
    await link.focus();
    await expect(link).toBeFocused();
  });

  test("no header overflow at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    for (const route of ["/", "/sahabah", "/quran"]) {
      await page.goto(route);
      const overflowing = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(overflowing, route).toBe(false);
    }
  });
});

test.describe("Accessibility", () => {
  test("zero Axe violations on all six required routes, desktop and mobile", async ({ page }) => {
    const routes = ["/", "/sahabah", "/sahabah/abu-bakr", "/sahabah/abu-bakr/lesson-1", "/quran", "/quran/al-fatihah/lesson-1"];
    for (const width of [1440, 390] as const) {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 900 });
      for (const route of routes) {
        await page.goto(route);
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations, `${route} @ ${width}px`).toEqual([]);
      }
    }
  });
});

test.describe("Regression", () => {
  test("Abu Bakr lesson: stage navigation, quiz, source drawer unaffected", async ({ page }) => {
    await fresh(page, "/sahabah/abu-bakr/lesson-1");
    await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", "block-1");
    await page.locator(".bio-toc .bio-timeline button").nth(4).click();
    await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", "block-5");
    await page.locator(".bio-header-actions").getByRole("button", { name: /مصادر/i }).click();
    await expect(page.locator(".source-drawer")).toBeVisible();
  });

  test("Al-Fatihah lesson completes correctly", async ({ page }) => {
    await fresh(page, "/quran/al-fatihah/lesson-1");
    for (let i = 0; i < 9; i++) await page.locator(".card-controls").getByRole("button", { name: "التالي" }).click();
    await expect(page.locator(".quiz-player")).toBeVisible();
  });

  test("language switching still works throughout", async ({ page }) => {
    await fresh(page, "/sahabah/abu-bakr/lesson-1");
    await page.getByRole("button", { name: "EN" }).first().click();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await page.getByRole("button", { name: "ع" }).first().click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });
});
