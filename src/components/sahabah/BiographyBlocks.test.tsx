import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { LessonBlock, LessonBlockType } from "@/content/types";
import { LanguageProvider } from "@/components/LanguageProvider";
import { SourceProvider } from "@/components/SourceSystem";
import { BiographyBlockRenderer } from "./BiographyBlocks";

function makeBlock(type: LessonBlockType, overrides: Partial<LessonBlock> = {}): LessonBlock {
  return {
    key: "block-1",
    type,
    title: { ar: "عنوان الفقرة", en: "Block title" },
    items: { ar: ["فقرة أولى بالعربية"], en: ["First paragraph in English"] },
    sourceKeys: [],
    sourceSummary: { ar: "مصادر مباشرة", en: "Direct sources" },
    deepSections: [],
    requiredForCompletion: true,
    ...overrides,
  };
}

function renderBlock(block: LessonBlock, language: "ar" | "en" = "en") {
  return render(
    <LanguageProvider>
      <SourceProvider sources={[]}>
        <BiographyBlockRenderer block={block} language={language} expandedDeepIds={[]} onToggleDeep={vi.fn()} />
      </SourceProvider>
    </LanguageProvider>,
  );
}

describe("the three newly registered generic biography block types", () => {
  it.each(["representative_event", "context_and_consequence", "event_consequence_meaning"] as const)(
    "renders %s bilingual content through the generic renderer instead of returning null",
    (type) => {
      const { container, unmount } = renderBlock(makeBlock(type));
      expect(container.querySelector(`[data-block-type="${type}"]`)).not.toBeNull();
      expect(screen.getByText("First paragraph in English")).toBeInTheDocument();
      unmount();
      const arabic = renderBlock(makeBlock(type), "ar");
      expect(arabic.getByText("فقرة أولى بالعربية")).toBeInTheDocument();
      arabic.unmount();
    },
  );

  it("exposes a representative_event deep section that opens and closes", async () => {
    const user = userEvent.setup();
    const block = makeBlock("representative_event", {
      deepSections: [{ key: "deep-1", title: { ar: "تعمق", en: "Deeper look" }, items: { ar: ["تفصيل"], en: ["Extra detail"] }, sourceKeys: [] }],
    });
    render(
      <LanguageProvider>
        <SourceProvider sources={[]}>
          <BiographyBlockRenderer block={block} language="en" expandedDeepIds={[]} onToggleDeep={vi.fn()} />
        </SourceProvider>
      </LanguageProvider>,
    );
    const details = screen.getByText("Deeper look").closest("details")!;
    expect(details.open).toBe(false);
    await user.click(screen.getByText("Deeper look"));
    expect(details.open).toBe(true);
    expect(screen.getByText("Extra detail")).toBeInTheDocument();
  });
});

describe("existing biography block types are unaffected by the new registrations", () => {
  it("still routes event_card through its own specialized component, not the generic renderer", () => {
    const { container } = renderBlock(makeBlock("event_card"));
    expect(container.querySelector(".bio-event-card")).not.toBeNull();
  });

  it("still returns null for a genuinely unknown, unapproved block type", () => {
    // Intentionally an invalid runtime value to prove the default case is not wildcard-accepting.
    const unknownType = "not_an_approved_block_type" as unknown as LessonBlockType;
    const { container } = renderBlock(makeBlock(unknownType));
    expect(container).toBeEmptyDOMElement();
  });
});
