import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FEEDBACK_CONTEXT_KEY } from "@/lib/feedback";
import { setAnalyticsProviderForTests } from "@/lib/analytics";
import { FeedbackForm } from "./FeedbackForm";
import { LanguageProvider, LanguageSwitch } from "./LanguageProvider";

describe("bilingual feedback form", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    setAnalyticsProviderForTests(null);
    vi.unstubAllGlobals();
  });

  it("renders Arabic by default, switches fully to English, and keeps LTR contact input", async () => {
    render(<LanguageProvider><LanguageSwitch /><FeedbackForm /></LanguageProvider>);
    expect(screen.getByRole("heading", { name: "أرسل ملاحظتك" })).toBeVisible();
    expect(screen.getByLabelText("بريد إلكتروني للمتابعة (اختياري)")).toHaveAttribute("dir", "ltr");
    const counter = screen.getByText("0 / 1200").closest(".character-count")!;
    expect(counter).toHaveAttribute("dir", "ltr");
    expect(counter.querySelector("bdi")).toHaveAttribute("dir", "ltr");
    expect(screen.getByText(/تُسلَّم الملاحظات عبر Formspree/)).toBeVisible();
    expect(screen.getByText(/لا يعمل أي مزوّد تحليلات نشط/)).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "EN" }));
    expect(screen.getByRole("heading", { name: "Send feedback" })).toBeVisible();
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
    expect(screen.getByText(/not a fatwa service/i)).toBeVisible();
    expect(screen.getByText(/retained there privately for up to 30 days/i)).toBeVisible();
    expect(screen.getByText(/No active analytics provider operates/i)).toBeVisible();
  });

  it("shows only normalized public page context", async () => {
    sessionStorage.setItem(FEEDBACK_CONTEXT_KEY, "/quran/al-fatihah/lesson-1?invite=private#card-2");
    render(<LanguageProvider><FeedbackForm /></LanguageProvider>);
    await waitFor(() => expect(screen.getByLabelText("سياق الصفحة الآمن")).toHaveValue("/quran/al-fatihah/lesson-1"));
  });

  it("keeps message text and focuses an honest unavailable status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ ok: false, code: "delivery_unavailable" }) }));
    render(<LanguageProvider><FeedbackForm /></LanguageProvider>);
    const message = "هذه ملاحظة واضحة عن تجربة التعلّم.";
    await userEvent.type(screen.getByLabelText("رسالة قصيرة"), message);
    await userEvent.click(screen.getByRole("button", { name: "إرسال الملاحظة" }));
    const alert = await screen.findByRole("alert");
    await waitFor(() => expect(alert).toHaveFocus());
    expect(alert).toHaveTextContent("لم تُرسل ملاحظتك");
    expect(screen.getByLabelText("رسالة قصيرة")).toHaveValue(message);
  });

  it("clears personal fields only after a real success response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
    render(<LanguageProvider><FeedbackForm /></LanguageProvider>);
    await userEvent.type(screen.getByLabelText("رسالة قصيرة"), "ملاحظة تجريبية مكتملة وواضحة.");
    await userEvent.type(screen.getByLabelText("بريد إلكتروني للمتابعة (اختياري)"), "tester@example.com");
    await userEvent.click(screen.getByText(/أوافق على استخدام/));
    await userEvent.click(screen.getByRole("button", { name: "إرسال الملاحظة" }));
    expect(await screen.findByRole("status")).toHaveTextContent("أُرسلت ملاحظتك بنجاح");
    expect(screen.getByLabelText("رسالة قصيرة")).toHaveValue("");
    expect(screen.getByLabelText("بريد إلكتروني للمتابعة (اختياري)")).toHaveValue("");
  });

  it("prevents parallel duplicate submissions even if submit is triggered twice", async () => {
    let resolveRequest!: (value: { ok: boolean; json: () => Promise<{ ok: boolean }> }) => void;
    const transport = vi.fn().mockReturnValue(new Promise((resolve) => { resolveRequest = resolve; }));
    vi.stubGlobal("fetch", transport);
    render(<LanguageProvider><FeedbackForm /></LanguageProvider>);
    await userEvent.type(screen.getByLabelText("رسالة قصيرة"), "ملاحظة تجريبية تمنع الإرسال المكرر.");
    const form = screen.getByRole("button", { name: "إرسال الملاحظة" }).closest("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(transport).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "جارٍ الإرسال…" })).toBeDisabled();
    resolveRequest({ ok: true, json: async () => ({ ok: true }) });
    expect(await screen.findByRole("status")).toHaveTextContent("أُرسلت ملاحظتك بنجاح");
  });

  it("keeps English failure status accessible and preserves personal fields", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ ok: false, code: "delivery_failed" }) }));
    render(<LanguageProvider><LanguageSwitch /><FeedbackForm /></LanguageProvider>);
    await userEvent.click(screen.getByRole("button", { name: "EN" }));
    await userEvent.type(screen.getByLabelText("Short message"), "Synthetic technical feedback for the alpha form.");
    await userEvent.type(screen.getByLabelText("Follow-up email (optional)"), "tester@example.com");
    await userEvent.click(screen.getByText(/I consent to this email/));
    await userEvent.click(screen.getByRole("button", { name: "Send feedback" }));
    const alert = await screen.findByRole("alert");
    await waitFor(() => expect(alert).toHaveFocus());
    expect(alert).toHaveTextContent("Feedback could not be sent");
    expect(screen.getByLabelText("Short message")).toHaveValue("Synthetic technical feedback for the alpha form.");
    expect(screen.getByLabelText("Follow-up email (optional)")).toHaveValue("tester@example.com");
  });

  it("never sends feedback text or contact details into analytics", async () => {
    const analytics = vi.fn();
    setAnalyticsProviderForTests({ track: analytics });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
    render(<LanguageProvider><FeedbackForm /></LanguageProvider>);
    await userEvent.type(screen.getByLabelText("رسالة قصيرة"), "نص اصطناعي للتحقق من عزل التحليلات.");
    await userEvent.type(screen.getByLabelText("بريد إلكتروني للمتابعة (اختياري)"), "tester@example.com");
    await userEvent.click(screen.getByText(/أوافق على استخدام/));
    await userEvent.click(screen.getByRole("button", { name: "إرسال الملاحظة" }));
    expect(await screen.findByRole("status")).toBeVisible();
    expect(analytics).not.toHaveBeenCalled();
  });
});
