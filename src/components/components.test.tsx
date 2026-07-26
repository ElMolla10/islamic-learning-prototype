import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adaptedFixture } from "@/content/adapter.test";
import { LanguageProvider, LanguageSwitch, useLanguage } from "./LanguageProvider";
import { LessonBlockRenderer } from "./LessonBlocks";
import { QuizPlayer } from "./QuizPlayer";
import { AllSourcesButton, SourceBadge, SourceProvider } from "./SourceSystem";

function Probe() { const { language } = useLanguage(); return <span data-testid="language">{language}</span>; }

describe("interactive lesson components", () => {
  beforeEach(()=>{localStorage.clear();sessionStorage.clear();document.documentElement.lang="ar";document.documentElement.dir="rtl";});
  afterEach(()=>cleanup());
  it("switches language and document direction without losing the preference", async () => {
    render(<LanguageProvider><LanguageSwitch/><Probe/></LanguageProvider>);
    await userEvent.click(screen.getByRole("button", { name: "EN" }));
    expect(screen.getByTestId("language")).toHaveTextContent("en");
    expect(document.documentElement).toHaveAttribute("dir","ltr");
    expect(localStorage.getItem("islamic-library-language")).toBe("en");
  });

  it("opens an accessible, sanitized source drawer and restores focus", async () => {
    const lesson=adaptedFixture();
    render(<LanguageProvider><SourceProvider sources={lesson.sources}><SourceBadge sourceKeys={[lesson.sources[0].key]}/></SourceProvider></LanguageProvider>);
    const trigger=screen.getByRole("button",{name:/فتح|Open/}); await userEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("dialog").textContent).not.toContain("/Users/");
    fireEvent.keyDown(document,{key:"Escape"});
    await waitFor(()=>expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(()=>expect(trigger).toHaveFocus());
  });

  it("renders the central verified hadith block", () => {
    const lesson=adaptedFixture(); const block=lesson.blocks.find(item=>item.type==="hadith_conversation")!;
    render(<LanguageProvider><SourceProvider sources={lesson.sources}><LessonBlockRenderer block={block} language="ar" expandedDeepIds={[]} onToggleDeep={vi.fn()}/></SourceProvider></LanguageProvider>);
    expect(screen.getByText(/قسمت الصلاة بيني وبين عبدي/)).toBeInTheDocument();
    expect(screen.getByText(/حوار يغيّر/)).toBeInTheDocument();
  });

  it("disables checking until valid, locks checked answers, and requires Next Question", async () => {
    const lesson=adaptedFixture(); const attempt=vi.fn();
    render(<LanguageProvider><QuizPlayer questions={lesson.quiz} language="en" onAttempt={attempt} onReview={vi.fn()}/></LanguageProvider>);
    const check=await screen.findByRole("button",{name:"Check answer"});expect(check).toBeDisabled();
    await userEvent.click(screen.getByLabelText("The greatest surah in the Qur'an"));
    expect(check).toBeEnabled();await userEvent.click(check);
    expect(screen.getByText("Correct answer")).toBeInTheDocument();
    expect(screen.getByLabelText("The greatest surah in the Qur'an")).toBeDisabled();
    expect(screen.getByRole("button",{name:"Next Question"})).toBeVisible();
    expect(sessionStorage.getItem("islamic-library-lesson-1-quiz")).toContain("question-1");
  });

  it("generates a new option order on retry",async()=>{
    const lesson=adaptedFixture();const question=[lesson.quiz[0]];const {container}=render(<QuizPlayer questions={question} language="en" onAttempt={vi.fn()} onReview={vi.fn()}/>);
    await screen.findByRole("button",{name:"Check answer"});const first=[...container.querySelectorAll(".quiz-option")].map(node=>node.getAttribute("data-option-id"));
    await userEvent.click(screen.getByLabelText("The longest surah"));await userEvent.click(screen.getByRole("button",{name:"Check answer"}));await userEvent.click(screen.getByRole("button",{name:"Retry quiz"}));
    await waitFor(()=>expect(container.querySelector('[data-attempt="2"]')).toBeTruthy());const second=[...container.querySelectorAll(".quiz-option")].map(node=>node.getAttribute("data-option-id"));expect(second).not.toEqual(first);
  });

  it("routes a deep incorrect answer to its exact card and expanded section",async()=>{
    const lesson=adaptedFixture();const onReview=vi.fn();render(<QuizPlayer questions={[lesson.quiz[4]]} language="en" onAttempt={vi.fn()} onReview={onReview}/>);
    await screen.findByRole("button",{name:"Check answer"});await userEvent.click(screen.getByLabelText("Because seeking help is unimportant"));await userEvent.click(screen.getByRole("button",{name:"Check answer"}));await userEvent.click(screen.getAllByRole("button",{name:"Review this idea"})[0]);expect(onReview).toHaveBeenCalledWith("card-6","V3D06B");
  });

  it("renders evidence-backed deep sections with classified sources", () => {
    const lesson=adaptedFixture(); const block=lesson.blocks[5];
    render(<LanguageProvider><SourceProvider sources={lesson.sources}><LessonBlockRenderer block={block} language="en" expandedDeepIds={[block.deepSections[0].key]} onToggleDeep={vi.fn()}/></SourceProvider></LanguageProvider>);
    expect(screen.getByText("From speaking about Him to addressing Him")).toBeVisible();
    expect(screen.getByText(/The surah begins by speaking about Allah/)).toBeVisible();
    expect(screen.getByRole("button",{name:/Hadith qudsi/})).toBeVisible();
  });

  it("presents three localized learner-facing source cards before expansion",async()=>{
    const lesson=adaptedFixture();const {container}=render(<LanguageProvider><SourceProvider sources={lesson.sources}><AllSourcesButton count={lesson.sources.length}/></SourceProvider></LanguageProvider>);
    await userEvent.click(screen.getByRole("button",{name:/عرض المصادر/}));const dialog=screen.getByRole("dialog");expect(container.querySelectorAll(".source-item")).toHaveLength(3);
    expect(dialog).toHaveTextContent("القرآن الكريم / المصدر الأصلي");expect(dialog).not.toHaveTextContent("Primary source");expect(dialog).not.toHaveTextContent("—");
    const firstCard=container.querySelector(".source-item")!;await userEvent.click(firstCard.querySelector("summary")!);expect(dialog).toHaveTextContent("سورة الفاتحة");expect(dialog).toHaveTextContent("سورة الحجر: ٨٧");expect(within(firstCard as HTMLElement).getByText("تفاصيل النسخة المصورة")).toBeVisible();
    const showAll=screen.getByRole("button",{name:"عرض بقية المصادر"});showAll.focus();expect(showAll).toHaveFocus();await userEvent.keyboard("{Enter}");expect(container.querySelectorAll(".source-item")).toHaveLength(10);expect(dialog.textContent).not.toMatch(/Primary|Tafsir|Hadith|Commentary|Qur’anic/);
  });
});
