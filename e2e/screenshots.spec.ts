import { mkdirSync } from "node:fs";
import path from "node:path";
import { test } from "@playwright/test";

const output=path.resolve(process.cwd(),"../../reports/screenshots/batch7a");
test.beforeAll(()=>mkdirSync(output,{recursive:true}));

test("capture Batch 7A visual review set",async({page})=>{
  await page.setViewportSize({width:390,height:844}); await page.goto("/quran/al-fatihah/lesson-1");
  await page.screenshot({path:path.join(output,"390-arabic-lesson-start.png")});
  await page.locator('[data-block-type="hadith_conversation"]').screenshot({path:path.join(output,"390-arabic-hadith-block.png")});
  await page.getByRole("button",{name:"EN"}).first().click();
  await page.locator('[data-block-type="theme_journey"]').screenshot({path:path.join(output,"390-english-theme-journey.png")});
  await page.setViewportSize({width:1440,height:1000}); await page.getByRole("button",{name:"ع"}).first().click(); await page.goto("/quran/al-fatihah/lesson-1");
  await page.screenshot({path:path.join(output,"1440-arabic-desktop-lesson.png")});
  await page.getByRole("button",{name:/فتح \d+ من المصادر/}).first().click(); await page.screenshot({path:path.join(output,"1440-source-drawer.png")}); await page.keyboard.press("Escape");
  await page.locator("#lesson-quiz").scrollIntoViewIfNeeded(); await page.getByLabel("أعظم سورة في القرآن").click(); await page.getByRole("button",{name:"تحقق"}).click();
  await page.locator("#lesson-quiz").screenshot({path:path.join(output,"quiz-question-answer-state.png")});
});
