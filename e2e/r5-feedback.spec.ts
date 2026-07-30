import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("feedback entry preserves a normalized public context and is bilingual", async ({ page }) => {
  await page.goto("/quran/al-fatihah/lesson-1?invite=private");
  await page.getByRole("link", { name: "أرسل ملاحظة" }).click();
  await expect(page).toHaveURL("/feedback");
  await expect(page.getByRole("heading", { name: "أرسل ملاحظتك" })).toBeVisible();
  await expect(page.getByLabel("سياق الصفحة الآمن")).toHaveValue("/quran/al-fatihah/lesson-1");
  await expect(page.getByText(/ليست خدمة فتوى/)).toBeVisible();
  await expect(page.getByText(/تُسلَّم الملاحظات عبر Formspree/)).toBeVisible();
  await expect(page.getByText(/لا يعمل أي مزوّد تحليلات نشط/)).toBeVisible();
  const counter = page.locator("#feedback-message-count");
  await expect(counter).toHaveText("0 / 1200");
  await expect(counter).toHaveAttribute("dir", "ltr");
  expect(await counter.evaluate((element) => getComputedStyle(element).direction)).toBe("ltr");

  await page.getByRole("button", { name: "EN" }).first().click();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { name: "Send feedback" })).toBeVisible();
  await expect(page.getByText(/not a fatwa service/i)).toBeVisible();
  await expect(page.getByText(/retained there privately for up to 30 days/i)).toBeVisible();
  await expect(page.getByText(/No active analytics provider operates/i)).toBeVisible();
});

test("unavailable delivery is honest, focused, and keeps the message", async ({ page }) => {
  await page.route("**/api/feedback", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false, code: "delivery_unavailable" }) }));
  await page.goto("/feedback");
  const message = "هذه ملاحظة واضحة عن تجربة التعلّم في النسخة الأولية.";
  await page.getByLabel("رسالة قصيرة").fill(message);
  await page.getByRole("button", { name: "إرسال الملاحظة" }).click();
  const alert = page.locator(".feedback-status");
  await expect(alert).toBeFocused();
  await expect(alert).toContainText("لم تُرسل ملاحظتك");
  await expect(page.getByLabel("رسالة قصيرة")).toHaveValue(message);
});

test("the server validates and never pretends a valid undelivered submission succeeded", async ({ page }) => {
  await page.goto("/feedback");
  const result = await page.evaluate(async (payload) => {
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { status: response.status, body: await response.json() };
  }, {
      category: "source_concern",
      message: "The source location needs a clearer explanation.",
      pageContext: "/sahabah/abu-bakr/lesson-2?private=value",
      language: "en",
      contact: "",
      contactConsent: false,
      website: "",
      startedAt: Date.now() - 5000,
  });
  expect(result.status).toBe(503);
  expect(result.body).toEqual({ ok: false, code: "delivery_unavailable" });
});

test("confirmed synthetic success is focused and clears personal fields", async ({ page }) => {
  await page.route("**/api/feedback", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }));
  await page.goto("/feedback");
  await page.getByRole("button", { name: "EN" }).first().click();
  await page.getByLabel("Short message").fill("Synthetic nonreligious feedback for the success-state check.");
  await page.getByLabel("Follow-up email (optional)").fill("tester@example.com");
  await page.getByText(/I consent to this email/).click();
  await page.getByRole("button", { name: "Send feedback" }).click();
  const status = page.locator(".feedback-status");
  await expect(status).toBeFocused();
  await expect(status).toHaveText("Your feedback was sent successfully.");
  await expect(page.getByLabel("Short message")).toHaveValue("");
  await expect(page.getByLabel("Follow-up email (optional)")).toHaveValue("");
});

test("feedback page has no serious Axe violations in Arabic or English", async ({ page }) => {
  await page.goto("/feedback");
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);

  await page.getByRole("button", { name: "EN" }).first().click();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
});
