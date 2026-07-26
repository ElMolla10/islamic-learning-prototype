import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("all required routes load and Lesson 1 renders real Draft 2 content", async ({ page }) => {
  const errors:string[]=[]; page.on("console",message=>{if(message.type()==="error")errors.push(message.text())});
  for(const route of ["/","/quran","/quran/al-fatihah","/quran/al-fatihah/lesson-1"]){const response=await page.goto(route);expect(response?.ok()).toBeTruthy();}
  await expect(page.locator("html")).toHaveAttribute("dir","rtl");
  await expect(page.getByRole("heading",{name:"لماذا سورة الفاتحة سورة فريدة؟"})).toBeVisible();
  await expect(page.locator("[data-block-key]")).toHaveCount(10);
  await expect(page.getByText(/قسمت الصلاة بيني وبين عبدي/)).toBeVisible();
  expect(errors).toEqual([]);
});

test("language, source drawer, progress, and quiz interactions work", async ({ page }) => {
  await page.goto("/quran/al-fatihah/lesson-1");
  await page.getByRole("button",{name:"EN"}).first().click();
  await expect(page.locator("html")).toHaveAttribute("dir","ltr");
  await expect(page.getByRole("heading",{name:"Why Surah al-Fatihah Is Unique"})).toBeVisible();
  await page.getByRole("button",{name:/Open \d+ sources/}).first().click();
  const dialog=page.getByRole("dialog"); await expect(dialog).toBeVisible();
  await expect(dialog).not.toContainText("/Users/"); await expect(dialog).not.toContainText("CLM"); await expect(dialog).not.toContainText("pdf_");
  await page.keyboard.press("Escape"); await expect(dialog).toBeHidden();
  await page.locator("#lesson-quiz").scrollIntoViewIfNeeded();
  await page.getByLabel("The greatest surah in the Qur'an").click();
  await page.getByRole("button",{name:"Check answer"}).click(); await expect(page.getByText("Well recalled")).toBeVisible();
  await page.getByRole("button",{name:"Mark lesson complete"}).click();
  const savedPercent=Number((await page.locator(".progress-copy strong").textContent())?.replace("%","") ?? 0); expect(savedPercent).toBeGreaterThan(0);
  await page.reload(); await expect(page.locator("html")).toHaveAttribute("dir","ltr"); await expect(page.getByText("Well recalled")).toBeVisible();
  await expect(page.getByRole("button",{name:"Lesson complete"})).toBeVisible();
  const restoredPercent=Number((await page.locator(".progress-copy strong").textContent())?.replace("%","") ?? 0); expect(restoredPercent).toBeGreaterThanOrEqual(savedPercent);
});

test("responsive layouts do not overflow", async ({ page }) => {
  for(const width of [320,375,390,430,768,1024,1440]){await page.setViewportSize({width,height:900});await page.goto("/quran/al-fatihah/lesson-1");const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);expect(overflow,`horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);}
});

test("lesson start has no serious automated accessibility violations", async ({ page }) => {
  await page.goto("/quran/al-fatihah/lesson-1");
  const results=await new AxeBuilder({page}).analyze();
  expect(results.violations).toEqual([]);
});
