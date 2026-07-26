import { expect, type Page } from "@playwright/test";

type TestLanguage = "ar" | "en";

const copy = {
  ar: { next: "التالي", nextQuestion:"السؤال التالي", check: "تحقق من الإجابة", true: "صحيح", false: "خطأ" },
  en: { next: "Next", nextQuestion:"Next Question", check: "Check answer", true: "True", false: "False" },
};

export async function resetPrototype(page: Page) {
  await page.goto("/quran/al-fatihah/lesson-1");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
}

export async function setLanguage(page: Page, language: TestLanguage) {
  const direction = language === "ar" ? "rtl" : "ltr";
  if ((await page.locator("html").getAttribute("dir")) !== direction) {
    await page.getByRole("button", { name: language === "ar" ? "ع" : "EN", exact: true }).first().click();
  }
  await expect(page.locator("html")).toHaveAttribute("dir", direction);
}

export async function advanceToQuiz(page: Page, language: TestLanguage) {
  for (let index = 1; index < 10; index += 1) {
    await page.locator(".card-controls").getByRole("button", { name: copy[language].next, exact: true }).click();
    await expect(page.locator(".guided-card-stage")).toHaveAttribute("data-current-card", `card-${index + 1}`);
  }
}

function quiz(page: Page) {
  return page.locator(".quiz-player");
}

async function chooseRadio(page: Page, label: string) {
  await quiz(page).getByLabel(label, { exact: true }).check();
}

async function arrangeOrdering(page:Page,language:TestLanguage,correct:boolean){
  const desired=language==="ar"?(correct?["الثناء على الله","العبادة والاستعانة","طلب الهداية"]:["العبادة والاستعانة","الثناء على الله","طلب الهداية"]):(correct?["Praise of Allah","Worship and seeking help","Request for guidance"]:["Worship and seeking help","Praise of Allah","Request for guidance"]);
  const list=quiz(page).locator(".ordering-list");
  for(let target=0;target<desired.length;target+=1){
    let labels=await list.locator(".ordering-item strong").allTextContents();let current=labels.indexOf(desired[target]);
    while(current>target){await list.locator(".ordering-item").filter({hasText:desired[target]}).getByRole("button",{name:new RegExp(language==="ar"?"^تحريك لأعلى":"^Move up")}).click();current-=1;labels=await list.locator(".ordering-item strong").allTextContents();}
  }
}

async function answerQuestion(page: Page, language: TestLanguage, question: number, correct: boolean) {
  const q = quiz(page);
  if (question === 1) {
    await chooseRadio(page, language === "ar" ? (correct ? "أعظم سورة في القرآن" : "أطول سورة") : (correct ? "The greatest surah in the Qur'an" : "The longest surah"));
  } else if (question === 2) {
    const labels = language === "ar" ? ["أم القرآن", "السبع المثاني", "فاتحة الكتاب"] : ["Umm al-Qur'an", "The Seven Oft-Repeated", "Opening of the Book"];
    const correctOptions = language === "ar" ? ["أصل وافتتاح يجمع المقاصد إجمالًا", "تتكرر في الصلاة", "يفتتح بها الكتاب والقراءة"] : ["An origin and opening that gathers purposes in summary", "Repeated in prayer", "The Book and recitation open with it"];
    const wrongOptions = [correctOptions[1], correctOptions[2], correctOptions[0]];
    for (let index = 0; index < labels.length; index += 1) {
      await q.getByLabel(new RegExp(`^${labels[index].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} —`)).selectOption({ label: (correct ? correctOptions : wrongOptions)[index] });
    }
  } else if (question === 3) {
    await arrangeOrdering(page,language,correct);
  } else if (question === 4) {
    await chooseRadio(page, correct ? copy[language].true : copy[language].false);
  } else if (question === 5) {
    await chooseRadio(page, language === "ar" ? (correct ? "لأن العبادة هي الغاية والاستعانة وسيلة إليها" : "لأن طلب العون غير مهم") : (correct ? "Because worship is the objective and seeking help is a means to it" : "Because seeking help is unimportant"));
  } else if (question === 6) {
    const correctLabels = language === "ar" ? ["للثبات على الهدى", "لزيادة البصيرة والنمو", "للوقاية من الزيغ والتقصير"] : ["For steadfastness", "For clearer insight and growth", "For protection from deviation and shortcoming"];
    if (correct) {
      for (const label of correctLabels) await q.getByLabel(label, { exact: true }).check();
    } else {
      await q.getByLabel(language === "ar" ? "لأنه لم يسمع بالإسلام من قبل" : "Because the believer has never heard of Islam", { exact: true }).check();
    }
  } else if (question === 7) {
    await chooseRadio(page, language === "ar" ? (correct ? "الصراط يشمل معرفة الحق واعتقاده والعمل به والثبات عليه" : "الهداية تعني المعلومات بلا عمل") : (correct ? "The path includes knowing truth, holding it, acting upon it, and remaining steadfast" : "Guidance means information without action"));
  } else if (question === 8) {
    const labels = language === "ar" ? ["أول السورة", "إياك نعبد وإياك نستعين", "اهدنا الصراط المستقيم"] : ["Opening", "You alone we worship and ask for help", "Guide us to the straight path"];
    const correctOptions = language === "ar" ? ["ثناء وتمجيد", "عبادة وافتقار عند موضع الوصل", "سؤال وطلب"] : ["Praise and glorification", "Worship and dependence at the joining point", "Request and supplication"];
    const wrongOptions = [correctOptions[2], correctOptions[0], correctOptions[1]];
    for (let index = 0; index < labels.length; index += 1) {
      await q.getByLabel(new RegExp(`^${labels[index].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} —`)).selectOption({ label: (correct ? correctOptions : wrongOptions)[index] });
    }
  } else if (question === 9) {
    await chooseRadio(page, correct ? copy[language].false : copy[language].true);
  } else {
    await chooseRadio(page,language==="ar"?(correct?"معرفة الله والثناء عليه، ثم العبادة والاستعانة، ثم طلب الهداية":"طلب الهداية أولًا، ثم ذكر أسماء السورة، ثم الاستغناء عن العبادة"):(correct?"Knowing and praising Allah, then worship and seeking help, then asking for guidance":"Asking for guidance first, then listing the surah's names, then no longer needing worship"));
  }

  await q.getByRole("button", { name: copy[language].check, exact: true }).click();
}

export async function completeQuiz(page: Page, language: TestLanguage, correctQuestions: Set<number>) {
  for (let question = 1; question <= 10; question += 1) {
    await answerQuestion(page, language, question, correctQuestions.has(question));
    if (question < 10) {
      await quiz(page).locator(".quiz-navigation").getByRole("button", { name: copy[language].nextQuestion, exact: true }).click();
    }
  }
}

export const exactlyHalfCorrect = new Set([1,2,3,4,5]);
export const passingQuestions = new Set([1,2,3,4,5,6]);
