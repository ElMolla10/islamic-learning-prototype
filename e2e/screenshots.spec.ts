import { mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { advanceToQuiz, completeQuiz, exactlyHalfCorrect, passingQuestions, resetPrototype } from "./helpers";

const output=path.resolve(process.cwd(),"../../reports/screenshots/batch7b");
test.beforeAll(()=>mkdirSync(output,{recursive:true}));

test("capture and inspect the Batch 7B visual review set",async({page})=>{
  test.setTimeout(180_000);
  await page.setViewportSize({width:390,height:844});await resetPrototype(page);
  await expect(page.locator(".card-controls")).toBeVisible();
  await page.screenshot({path:path.join(output,"390-arabic-current-card-bottom-navigation.png"),fullPage:true});

  await page.locator(".card-controls").getByRole("button",{name:"التالي",exact:true}).click();
  await page.locator(".card-controls").getByRole("button",{name:"التالي",exact:true}).click();
  await page.locator("details.deep-section summary").first().click();
  await page.screenshot({path:path.join(output,"390-arabic-go-deeper-expanded.png"),fullPage:true});

  await resetPrototype(page);await advanceToQuiz(page,"ar");await completeQuiz(page,"ar",exactlyHalfCorrect);
  await page.locator(".quiz-result").scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(output,"390-quiz-failing-state.png"),fullPage:true});

  await page.locator(".quiz-result").getByRole("button",{name:"أعد الاختبار"}).click();await completeQuiz(page,"ar",passingQuestions);
  await page.locator(".quiz-result").scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(output,"390-quiz-passing-state.png"),fullPage:true});

  await page.setViewportSize({width:1440,height:1000});await resetPrototype(page);
  await page.screenshot({path:path.join(output,"1440-desktop-enlarged-typography.png"),fullPage:true});
  await page.getByRole("button",{name:"وضع التركيز"}).click();
  await page.screenshot({path:path.join(output,"1440-focus-mode.png"),fullPage:true});
  await page.getByRole("button",{name:"إنهاء وضع التركيز"}).click();

  for(let index=0;index<5;index+=1)await page.locator(".card-controls").getByRole("button",{name:"التالي",exact:true}).click();
  await expect(page.locator(".guided-card-stage")).toHaveAttribute("data-current-card","card-6");
  await page.screenshot({path:path.join(output,"1440-hadith-card.png"),fullPage:true});
  await page.screenshot({path:path.join(output,"1440-right-navigator-states.png"),fullPage:true});

  for(let index=6;index<10;index+=1)await page.locator(".card-controls").getByRole("button",{name:"التالي",exact:true}).click();
  await completeQuiz(page,"ar",passingQuestions);await page.getByTestId("lesson-completed").scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(output,"1440-lesson-completed.png"),fullPage:true});
});
