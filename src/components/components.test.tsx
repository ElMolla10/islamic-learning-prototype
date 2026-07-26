import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { adaptedFixture } from "@/content/adapter.test";
import { LanguageProvider, LanguageSwitch, useLanguage } from "./LanguageProvider";
import { LessonBlockRenderer } from "./LessonBlocks";
import { QuizPlayer } from "./QuizPlayer";
import { SourceBadge, SourceProvider } from "./SourceSystem";

function Probe() { const { language } = useLanguage(); return <span data-testid="language">{language}</span>; }

describe("interactive lesson components", () => {
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

  it("gives immediate quiz feedback and persists the answer in session storage", async () => {
    const lesson=adaptedFixture(); const attempt=vi.fn();
    render(<LanguageProvider><QuizPlayer questions={lesson.quiz} language="en" onAttempt={attempt} onReview={vi.fn()}/></LanguageProvider>);
    await userEvent.click(screen.getByLabelText("The greatest surah in the Qur'an"));
    await userEvent.click(screen.getByRole("button",{name:"Check answer"}));
    expect(screen.getByText("Well recalled")).toBeInTheDocument();
    expect(sessionStorage.getItem("islamic-library-lesson-1-quiz")).toContain("question-1");
  });

  it("renders evidence-backed deep sections with classified sources", () => {
    const lesson=adaptedFixture(); const block=lesson.blocks[5];
    render(<LanguageProvider><SourceProvider sources={lesson.sources}><LessonBlockRenderer block={block} language="en" expandedDeepIds={[block.deepSections[0].key]} onToggleDeep={vi.fn()}/></SourceProvider></LanguageProvider>);
    expect(screen.getByText("From speaking about Him to addressing Him")).toBeVisible();
    expect(screen.getByText(/The surah begins by speaking about Allah/)).toBeVisible();
    expect(screen.getByRole("button",{name:/Hadith qudsi/})).toBeVisible();
  });
});
