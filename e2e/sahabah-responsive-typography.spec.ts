import { mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

// Visual regression coverage for Adjustment 2 (long-title responsive typography) across the breakpoints
// named in the task brief: 1440 desktop, ~1024 tablet, ~768 narrow tablet, ~390 mobile, ~320 narrow mobile.

const output = path.resolve(process.cwd(), "../../reports/screenshots/ui_polish");
test.beforeAll(() => mkdirSync(output, { recursive: true }));

const widths = [1440, 1024, 768, 390, 320] as const;

async function noHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
}

async function captureBoth(page: Page, route: string, name: string) {
  for (const width of widths) {
    await page.setViewportSize({ width, height: Math.max(700, Math.round(width * 1.3)) });
    // The language toggle persists in localStorage across page.goto() navigations, so each iteration must
    // explicitly force Arabic before the AR shot rather than assume a fresh/default state.
    await page.goto(route);
    await page.evaluate(() => localStorage.removeItem("islamic-library-language"));
    await page.reload();
    await expect(page.locator("h1").first()).toBeVisible();
    expect(await noHorizontalOverflow(page), `${name} @ ${width}px (AR)`).toBe(true);
    await page.screenshot({ path: path.join(output, `${width}-${name}-ar.png`) });

    await page.getByRole("button", { name: "EN" }).first().click();
    expect(await noHorizontalOverflow(page), `${name} @ ${width}px (EN)`).toBe(true);
    await page.screenshot({ path: path.join(output, `${width}-${name}-en.png`) });
  }
}

test("responsive title screenshots: Sahabah landing page, AR + EN, 5 breakpoints", async ({ page }) => {
  test.setTimeout(120_000);
  await captureBoth(page, "/sahabah", "sahabah-landing");
});

test("responsive title screenshots: Abu Bakr path page, AR + EN, 5 breakpoints", async ({ page }) => {
  test.setTimeout(120_000);
  await captureBoth(page, "/sahabah/abu-bakr", "abu-bakr-path");
});

test("responsive title screenshots: Lesson 1 header, AR + EN, 5 breakpoints", async ({ page }) => {
  test.setTimeout(120_000);
  await captureBoth(page, "/sahabah/abu-bakr/lesson-1", "lesson1-header");
});

test("no horizontal overflow on the Qur'an category page (shared .category-hero regression check)", async ({ page }) => {
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/quran");
    expect(await noHorizontalOverflow(page), `/quran @ ${width}px`).toBe(true);
  }
});
