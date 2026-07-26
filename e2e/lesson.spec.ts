import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { advanceToQuiz, completeQuiz, exactlyHalfCorrect, passingQuestions, resetPrototype, setLanguage } from "./helpers";

test("all required routes load and Lesson 1 renders structured Draft 3 content", async ({ page }) => {
  const errors:string[]=[]; page.on("console",message=>{if(message.type()==="error"&&!message.text().includes("/_next/webpack-hmr"))errors.push(message.text())});
  for(const route of ["/","/quran","/quran/al-fatihah","/quran/al-fatihah/lesson-1"]){const response=await page.goto(route);expect(response?.ok()).toBeTruthy();}
  await expect(page.locator("html")).toHaveAttribute("dir","rtl");
  await expect(page.getByRole("heading",{name:"لماذا سورة الفاتحة سورة فريدة؟"})).toBeVisible();
  await expect(page.locator(".guided-card-stage")).toHaveAttribute("data-current-card","card-1");
  await expect(page.getByText("الفكرة الأساسية")).toBeVisible();
  await expect(page.locator(".lesson-navigator:not(.compact) li")).toHaveCount(10);
  expect(errors).toEqual([]);
});

test("Arabic learner visits every card, passes above 50%, and completes only Lesson 1", async ({ page }) => {
  await resetPrototype(page);
  await advanceToQuiz(page,"ar");
  expect(Number((await page.locator(".progress-copy strong").textContent())?.replace("%","")??100)).toBeLessThan(100);
  await completeQuiz(page,"ar",passingQuestions);
  await expect(page.locator(".quiz-result")).toHaveAttribute("data-passed","true");
  await expect(page.locator(".quiz-result").getByText("أتممت الدرس بنجاح")).toBeVisible();
  await expect(page.getByTestId("lesson-completed")).toContainText("ما يزال مسار سورة الفاتحة قيد التقدم");
  await expect(page.locator(".progress-copy strong")).toHaveText("100%");
  await expect(page.getByText("اكتملت السورة")).toHaveCount(0);
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem("islamic-library-prototype-progress")??"{}"));
  expect(stored.lessonCompleted).toBe(true);expect(stored.completedLessonIds).toContain("al-fatihah-lesson-1");
});

test("English learner scoring exactly 50% does not pass",async({page})=>{
  await resetPrototype(page);await setLanguage(page,"en");await advanceToQuiz(page,"en");
  await completeQuiz(page,"en",exactlyHalfCorrect);
  await expect(page.locator(".quiz-result")).toHaveAttribute("data-passed","false");
  await expect(page.locator(".quiz-result")).toContainText("Score: 5 / 10");
  await expect(page.locator(".quiz-result")).toContainText("Concepts answered correctly");await expect(page.locator(".quiz-result")).toContainText("Concepts to revisit");
  await expect(page.locator(".quiz-result").getByRole("button",{name:"Review incorrect answers"})).toBeVisible();await expect(page.locator(".quiz-result").getByRole("button",{name:"Retry quiz"})).toBeVisible();await expect(page.locator(".quiz-result").getByRole("button",{name:"Return to lesson"})).toBeVisible();await expect(page.locator(".quiz-result").getByRole("button",{name:/Continue when/})).toBeDisabled();
  await expect(page.getByTestId("lesson-completed")).toHaveCount(0);
});

test("learner can follow an incorrect-answer review link, return, retry, and pass",async({page})=>{
  await resetPrototype(page);await setLanguage(page,"en");await advanceToQuiz(page,"en");await completeQuiz(page,"en",exactlyHalfCorrect);
  await page.locator(".quiz-result").getByRole("button",{name:"Review this idea"}).first().click();
  await expect(page.locator(".guided-card-stage")).not.toHaveAttribute("data-current-card","card-10");
  await expect(page.locator("details.deep-section[open]")).toBeVisible();
  await page.locator(".lesson-navigator:not(.compact)").getByRole("button",{name:/^10\./}).click();
  await page.locator(".quiz-result").getByRole("button",{name:"Retry quiz"}).click();
  await completeQuiz(page,"en",passingQuestions);
  await expect(page.locator(".quiz-result")).toHaveAttribute("data-passed","true");
  await expect(page.getByTestId("lesson-completed")).toBeVisible();
});

test("refresh and language switching preserve the current card and progress",async({page})=>{
  await resetPrototype(page);
  for(let index=0;index<4;index+=1)await page.locator(".card-controls").getByRole("button",{name:"التالي",exact:true}).click();
  await expect(page.locator(".guided-card-stage")).toHaveAttribute("data-current-card","card-5");
  await page.reload();await expect(page.locator(".guided-card-stage")).toHaveAttribute("data-current-card","card-5");
  await setLanguage(page,"en");await expect(page.locator(".guided-card-stage")).toHaveAttribute("data-current-card","card-5");
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem("islamic-library-prototype-progress")??"{}"));
  expect(stored.visitedCardIds).toEqual(expect.arrayContaining(["card-1","card-2","card-3","card-4","card-5"]));
});

test("deeper sections, Focus Mode, source classification, drawer privacy, and keyboard controls work",async({page})=>{
  await resetPrototype(page);
  await page.locator(".card-controls").getByRole("button",{name:"التالي",exact:true}).click();
  await page.locator(".card-controls").getByRole("button",{name:"التالي",exact:true}).click();
  const deeper=page.locator("details.deep-section").first();await deeper.locator("summary").click();await expect(deeper).toHaveAttribute("open","");
  await expect(page.getByText(/مصادر تفسيرية مباشرة|حديث صحيح/).first()).toBeVisible();
  await page.getByRole("button",{name:"وضع التركيز"}).click();await expect(page.locator(".guided-lesson")).toHaveClass(/focus-mode/);
  await page.getByRole("button",{name:/فتح المصادر الداعمة:/}).first().click();const dialog=page.getByRole("dialog");await expect(dialog).toBeVisible();
  await expect(dialog).not.toContainText("/Users/");await expect(dialog).not.toContainText("OCR");await expect(dialog).not.toContainText("DCLM");await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();await page.keyboard.press("Tab");await expect(page.locator(":focus")).toBeVisible();
});

test("quiz response locks after checking and option order survives refresh",async({page})=>{
  await resetPrototype(page);await setLanguage(page,"en");await advanceToQuiz(page,"en");
  const before=await page.locator(".quiz-option").evaluateAll(nodes=>nodes.map(node=>node.getAttribute("data-option-id")));
  await page.getByLabel("The longest surah",{exact:true}).check();await page.getByRole("button",{name:"Check answer",exact:true}).click();
  await expect(page.getByLabel("The longest surah",{exact:true})).toBeDisabled();await expect(page.getByText("Incorrect answer",{exact:true})).toBeVisible();await expect(page.getByRole("button",{name:"Next Question",exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Next Question",exact:true}).click();await page.getByRole("button",{name:"Previous Question",exact:true}).click();const afterNavigation=await page.locator(".quiz-option").evaluateAll(nodes=>nodes.map(node=>node.getAttribute("data-option-id")));expect(afterNavigation).toEqual(before);
  await page.reload();const after=await page.locator(".quiz-option").evaluateAll(nodes=>nodes.map(node=>node.getAttribute("data-option-id")));expect(after).toEqual(before);await expect(page.getByLabel("The longest surah",{exact:true})).toBeDisabled();
});

test("localized source drawer groups references and exposes the full list accessibly",async({page})=>{
  await resetPrototype(page);await page.getByRole("button",{name:/عرض المصادر \(10\)/}).click();const dialog=page.getByRole("dialog");
  await expect(dialog.locator(".source-item")).toHaveCount(3);await expect(dialog).toContainText("القرآن الكريم / المصدر الأصلي");await expect(dialog).not.toContainText("Primary source");await expect(dialog).not.toContainText("—");
  await dialog.locator(".source-item>summary").first().click();await expect(dialog).toContainText("سورة الفاتحة");await expect(dialog).toContainText("سورة الحجر: ٨٧");await expect(dialog.getByText("تفاصيل النسخة المصورة").first()).toBeVisible();
  const show=dialog.getByRole("button",{name:"عرض بقية المصادر"});await show.focus();await page.keyboard.press("Enter");await expect(dialog.locator(".source-item")).toHaveCount(10);
  const results=await new AxeBuilder({page}).include(".source-drawer").analyze();expect(results.violations).toEqual([]);
});

test("responsive layouts do not overflow", async ({ page }) => {
  for(const width of [320,375,390,430,768,1024,1440]){await page.setViewportSize({width,height:900});await page.goto("/quran/al-fatihah/lesson-1");const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);expect(overflow,`horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);}
});

test("desktop typography reaches Batch 7B readability targets",async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await page.goto("/quran/al-fatihah/lesson-1");
  const sizes=await page.evaluate(()=>({title:parseFloat(getComputedStyle(document.querySelector(".lesson-header h1")!).fontSize),heading:parseFloat(getComputedStyle(document.querySelector(".block-heading h2")!).fontSize),body:parseFloat(getComputedStyle(document.querySelector(".lesson-block p")!).fontSize),nav:parseFloat(getComputedStyle(document.querySelector(".lesson-navigator strong")!).fontSize),metadata:parseFloat(getComputedStyle(document.querySelector(".lesson-kicker")!).fontSize)}));
  expect(sizes.title).toBeGreaterThanOrEqual(56);expect(sizes.heading).toBeGreaterThanOrEqual(34);expect(sizes.body).toBeGreaterThanOrEqual(20);expect(sizes.nav).toBeGreaterThanOrEqual(15);expect(sizes.metadata).toBeGreaterThanOrEqual(14);
});

test("lesson start has no serious automated accessibility violations", async ({ page }) => {
  await page.goto("/quran/al-fatihah/lesson-1");
  const results=await new AxeBuilder({page}).analyze();
  expect(results.violations).toEqual([]);
});
