import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ANALYTICS_EVENT_NAMES,
  configureAnalyticsProvider,
  normalizePublicPath,
  sanitizeAnalyticsEvent,
  setAnalyticsProviderForTests,
  trackAnalytics,
  type AnalyticsEvent,
} from "./analytics";

afterEach(() => setAnalyticsProviderForTests(null));

describe("analytics privacy boundary", () => {
  it("admits exactly the five approved event names", () => {
    expect(ANALYTICS_EVENT_NAMES).toEqual(["lesson_start", "lesson_complete", "quiz_submit", "source_drawer_open", "language_switch"]);
    expect(sanitizeAnalyticsEvent("page_view", {})).toBeNull();
    expect(sanitizeAnalyticsEvent("feedback_submit", {})).toBeNull();
  });

  it("uses event-specific allowlists and drops every unapproved property", () => {
    const event = sanitizeAnalyticsEvent("quiz_submit", {
      lesson_slug: "al-fatihah-lesson-1",
      language: "en",
      correct: 6,
      total: 10,
      raw_answer: "private answer",
      learner_text: "must not leave the browser",
      internal_status: "internal_unapproved",
    });
    expect(event).toEqual({
      name: "quiz_submit",
      properties: { lesson_slug: "al-fatihah-lesson-1", language: "en", correct: 6, total: 10 },
    });
    expect(sanitizeAnalyticsEvent("quiz_submit", { lesson_slug: "private-research-id", language: "en", correct: 1, total: 1 })).toBeNull();
  });

  it("strips query strings and fragments and rejects non-public page context", () => {
    expect(normalizePublicPath("https://alpha.example/quran/al-fatihah/lesson-1?token=secret#card-2")).toBe("/quran/al-fatihah/lesson-1");
    expect(normalizePublicPath("/sahabah/abu-bakr/?tester=someone")).toBe("/sahabah/abu-bakr");
    expect(normalizePublicPath("/private/research/AB02-RQ03")).toBeNull();
    expect(
      sanitizeAnalyticsEvent("language_switch", {
        public_path: "/quran/al-fatihah?invite=private",
        previous_language: "ar",
        next_language: "en",
        referrer: "https://example.test/private",
      }),
    ).toEqual({
      name: "language_switch",
      properties: { public_path: "/quran/al-fatihah", previous_language: "ar", next_language: "en" },
    });
  });

  it("validates every approved schema without accepting unsafe values", () => {
    expect(sanitizeAnalyticsEvent("lesson_start", { lesson_slug: "abu-bakr-lesson-1", language: "ar" })).not.toBeNull();
    expect(sanitizeAnalyticsEvent("lesson_complete", { lesson_slug: "abu-bakr-lesson-2", language: "en" })).not.toBeNull();
    expect(sanitizeAnalyticsEvent("quiz_submit", { lesson_slug: "al-fatihah-lesson-1", language: "ar", correct: 11, total: 10 })).toBeNull();
    expect(sanitizeAnalyticsEvent("source_drawer_open", { lesson_slug: "al-fatihah-lesson-1", language: "ar", source_context: "section_sources", card_index: 11, card_count: 10 })).toBeNull();
    expect(sanitizeAnalyticsEvent("language_switch", { public_path: "/", previous_language: "ar", next_language: "ar" })).toBeNull();
  });

  it("enforces the exact discriminated schema for both source drawer contexts", () => {
    const base = { lesson_slug: "al-fatihah-lesson-1", language: "ar" };
    expect(sanitizeAnalyticsEvent("source_drawer_open", {
      ...base,
      source_context: "section_sources",
      card_index: 2,
      card_count: 10,
    })).toEqual({
      name: "source_drawer_open",
      properties: { ...base, source_context: "section_sources", card_index: 2, card_count: 10 },
    });
    expect(sanitizeAnalyticsEvent("source_drawer_open", { ...base, source_context: "all_sources" })).toEqual({
      name: "source_drawer_open",
      properties: { ...base, source_context: "all_sources" },
    });

    const invalid = [
      { ...base, source_context: "section_sources" },
      { ...base, source_context: "section_sources", card_index: 1 },
      { ...base, source_context: "section_sources", card_count: 10 },
      { ...base, source_context: "section_sources", card_index: 0, card_count: 10 },
      { ...base, source_context: "section_sources", card_index: 1.5, card_count: 10 },
      { ...base, source_context: "section_sources", card_index: 101, card_count: 101 },
      { ...base, source_context: "section_sources", card_index: 11, card_count: 10 },
      { ...base, source_context: "all_sources", card_index: 1 },
      { ...base, source_context: "all_sources", card_count: 10 },
      { ...base, source_context: "all_sources", card_index: 1, card_count: 10 },
      { ...base, source_context: "section_sources", card_index: 1, card_count: 10, raw_answer: "must not pass" },
      { ...base, source_context: "unknown", card_index: 1, card_count: 10 },
    ];
    for (const properties of invalid) expect(sanitizeAnalyticsEvent("source_drawer_open", properties)).toBeNull();
  });

  it("is a safe no-op in automated tests unless a provider is deliberately mocked", () => {
    const track = vi.fn();
    configureAnalyticsProvider({ track });
    expect(trackAnalytics("lesson_start", { lesson_slug: "al-fatihah-lesson-1", language: "ar" })).toBe(false);
    expect(track).not.toHaveBeenCalled();

    setAnalyticsProviderForTests({ track });
    expect(trackAnalytics("lesson_start", { lesson_slug: "al-fatihah-lesson-1", language: "ar" })).toBe(true);
    expect(track).toHaveBeenCalledOnce();
  });

  it("isolates synchronous and asynchronous provider failures", async () => {
    setAnalyticsProviderForTests({ track: () => { throw new Error("provider unavailable"); } });
    expect(() => trackAnalytics("lesson_start", { lesson_slug: "al-fatihah-lesson-1", language: "ar" })).not.toThrow();
    expect(trackAnalytics("lesson_start", { lesson_slug: "al-fatihah-lesson-1", language: "ar" })).toBe(false);

    const rejection = Promise.reject(new Error("network failed"));
    setAnalyticsProviderForTests({ track: () => rejection });
    expect(trackAnalytics("lesson_start", { lesson_slug: "al-fatihah-lesson-1", language: "ar" })).toBe(true);
    await expect(rejection).rejects.toThrow("network failed");
  });

  it("remains a safe no-op without a provider and across repeated failed dispatches", () => {
    configureAnalyticsProvider(null);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(trackAnalytics("lesson_start", { lesson_slug: "al-fatihah-lesson-1", language: "en" })).toBe(false);
    }

    const failure = vi.fn(() => { throw new Error("provider failure"); });
    setAnalyticsProviderForTests({ track: failure });
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(() => trackAnalytics("lesson_start", { lesson_slug: "al-fatihah-lesson-1", language: "en" })).not.toThrow();
    }
    expect(failure).toHaveBeenCalledTimes(5);
  });

  it("never forwards an unsupported event even through an untyped caller", () => {
    const events: AnalyticsEvent[] = [];
    setAnalyticsProviderForTests({ track: (event) => { events.push(event); } });
    const unsafeTrack = trackAnalytics as (name: string, properties: Record<string, unknown>) => boolean;
    expect(unsafeTrack("session_replay", { text: "private" })).toBe(false);
    expect(events).toEqual([]);
  });
});
