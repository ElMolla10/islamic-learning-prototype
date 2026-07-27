import { mkdirSync } from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const output = path.resolve(process.cwd(), "../../reports/screenshots/batch8b");
test.beforeAll(() => mkdirSync(output, { recursive: true }));

const routes = ["/sahabah", "/sahabah/abu-bakr", "/sahabah/abu-bakr/lesson-1"];

test("all 3 Sahabah routes load with no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("/_next/webpack-hmr")) errors.push(message.text());
  });
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.ok(), route).toBeTruthy();
  }
  expect(errors).toEqual([]);
});

test("Abu Bakr lesson-1 chapter navigation works and desktop nav / mobile drawer stay in sync", async ({ page }) => {
  await page.goto("/sahabah/abu-bakr/lesson-1");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();

  // v2 real content: 10 cards, 4 timeline phases -> AB01(block-1), AB05(block-5), AB07(block-7), AB09(block-9).
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", "block-1");
  await page.locator(".bio-toc .bio-timeline button").nth(1).click();
  await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", "block-5");

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".bio-toc")).not.toBeVisible();
  await page.getByRole("button", { name: "مراحل الفصل" }).click();
  const drawer = page.getByRole("dialog", { name: "مراحل الفصل" });
  await expect(drawer).toBeVisible();
  await drawer.locator(".bio-timeline button").nth(2).click();
  await expect(drawer).not.toBeVisible();
  await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", "block-7");
});

test("the side-rail person entry (AB06, 'Amir ibn Fuhayrah) opens a bottom sheet with matching content", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/sahabah/abu-bakr/lesson-1");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  for (let index = 0; index < 5; index += 1) await page.locator(".bio-controls").getByRole("button", { name: "التالي" }).click();
  await expect(page.locator(".bio-stage")).toHaveAttribute("data-current-card", "block-6");
  const railButton = page.locator(".bio-rail-people button").first();
  const name = (await railButton.textContent()) ?? "";
  await railButton.click();
  const sheet = page.getByRole("dialog", { name });
  await expect(sheet).toBeVisible();
  await expect(sheet.locator(".bio-person-detail h3")).toHaveText(name);
});

test("git ls-files shows no private research material bundled into the app", async () => {
  const { execSync } = await import("node:child_process");
  const tracked = execSync("git ls-files", { cwd: process.cwd() }).toString();
  const forbiddenPathFragments = ["content_research/", "content_drafts/", "evidence_images/", "extracted_text", "reports/", "source_review_records/"];
  const forbiddenFileNamePatterns = [/\.pdf$/i, /\.jpe?g$/i, /\.png$/i, /reviewer_questions/i, /decision_form/i, /decision_application_report/i, /sentence_traceability/i, /^claims\.json$/i, /human_review_packet/i, /reconciliation_report/i, /draft_decisions/i];
  const offending = tracked
    .split("\n")
    .filter(Boolean)
    .filter((file) => forbiddenPathFragments.some((fragment) => file.includes(fragment)) || forbiddenFileNamePatterns.some((pattern) => pattern.test(file.split("/").pop() ?? file)));
  expect(offending).toEqual([]);
});

test("Sahabah routes have no serious automated accessibility violations", async ({ page }) => {
  for (const route of routes) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, route).toEqual([]);
  }
});

test("capture desktop and mobile screenshots for all 3 Sahabah routes", async ({ page }) => {
  test.setTimeout(120_000);
  for (const width of [390, 1440] as const) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    for (const route of routes) {
      await page.goto(route);
      const name = route.replace(/\//g, "-").replace(/^-/, "") || "home";
      await page.screenshot({ path: path.join(output, `${width}-${name}.png`), fullPage: true });
    }
  }
});
