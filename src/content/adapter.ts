import type { GlossaryTerm, Lesson, LessonBlock, QuizQuestion, Source } from "./types";

type RawBlock = {
  block_id: string;
  block_type: LessonBlock["type"];
  title_ar: string;
  title_en: string;
  content_items_ar: string[];
  content_items_en: string[];
  claim_ids: string[];
  source_summary_ar?: string;
  source_summary_en?: string;
  required_for_completion?: boolean;
  deep_sections?: {
    section_id: string;
    title_ar: string;
    title_en: string;
    content_items_ar: string[];
    content_items_en: string[];
    claim_ids: string[];
  }[];
};
type RawSource = {
  display_title: string;
  author: string;
  source_role: string[];
  claims_supported: string[];
  locations: { volume: number | null; pdf_page: number; printed_page: number | null }[];
  hadith_numbers: string[];
  scripture_references?: { ar: string; en: string }[];
};
type RawQuestion = {
  question_id: string;
  type: QuizQuestion["type"];
  prompt_ar: string;
  prompt_en: string;
  options?: { id: string; ar: string; en: string }[] | null;
  items?: { id: string; ar: string; en: string }[] | null;
  matching_rows?: { id: string; ar: string; en: string }[] | null;
  matching_choices?: { id: string; ar: string; en: string }[] | null;
  correct_answer: string[] | boolean;
  explanation_ar: string | null;
  explanation_en: string | null;
  depth?: "core" | "deep";
  review_card_id?: string;
  review_deep_section_id?: string;
};
type RawTerm = { arabic: string; english: string; definition_ar: string; definition_en: string };

function supportLevel(roles: string[]): Source["supportLevel"] {
  if (roles.some(role=>role==="revelation_quran"||role==="primary_hadith_collection")) return "primary_evidence";
  if (roles.some(role=>role==="hadith_commentary"||role==="primary_hadith_collection_with_commentary")) return "direct_commentary";
  if (roles.some(role=>role.includes("tafsir"))) return "supporting_tafsir";
  return "broader_comparative_support";
}

function sourceReason(roles: string[]): Record<"ar" | "en", string> {
  if (roles.includes("revelation_quran")) return { ar: "للتحقق من نص الآيات وموضع السورة.", en: "Used to verify the Qur’anic wording and Surah location." };
  if (roles.includes("primary_hadith_collection")) return { ar: "للتحقق من نص الحديث وموضعه في المصدر الأصلي.", en: "Used to verify the hadith wording and its location in the primary collection." };
  if (roles.includes("hadith_commentary")) return { ar: "لفهم لفظ الحديث وسياقه كما شرحه أهل العلم.", en: "Used to understand the hadith wording and context through commentary." };
  if (roles.includes("quranic_vocabulary_reference")) return { ar: "للتحقق من الدلالة اللغوية لألفاظ السورة.", en: "Used to verify the linguistic meaning of Qur’anic vocabulary." };
  return { ar: "لدعم شرح السورة من مصدر تفسير متحقق الموضع.", en: "Used to support the Surah explanation from a verified tafsir location." };
}

export function adaptLesson(raw: {
  blocks: { blocks: RawBlock[] };
  quiz: { questions: RawQuestion[] };
  sources: { sources: RawSource[] };
  glossary: { terms: RawTerm[] };
}): Lesson {
  const sources: Source[] = raw.sources.sources.map((source, index) => ({
    key: `source-${index + 1}`,
    title: source.display_title,
    author: source.author,
    roleCodes: [...source.source_role],
    supportLevel: supportLevel(source.source_role),
    locations: source.locations.map((location) => ({
      volume: location.volume ?? undefined,
      page: location.pdf_page,
      printedPage: location.printed_page ?? undefined,
    })),
    scriptureReferences: (source.scripture_references ?? []).map(reference=>({ar:reference.ar,en:reference.en})),
    hadithNumbers: source.hadith_numbers,
    reason: sourceReason(source.source_role),
  }));
  const sourceClaims = raw.sources.sources.map((source) => new Set(source.claims_supported));
  const sourcesForClaims = (claimIds: string[]) => sourceClaims
    .map((claims, sourceIndex) => claimIds.some((claim) => claims.has(claim)) ? sources[sourceIndex].key : null)
    .filter((key): key is string => key !== null);
  const cardKeyByRawId = new Map(raw.blocks.blocks.map((block, index) => [block.block_id, `card-${index + 1}`]));
  const blocks: LessonBlock[] = raw.blocks.blocks.map((block, index) => ({
    key: `card-${index + 1}`,
    type: block.block_type,
    title: { ar: block.title_ar, en: block.title_en },
    items: { ar: block.content_items_ar, en: block.content_items_en },
    sourceKeys: sourcesForClaims(block.claim_ids),
    sourceSummary: { ar: block.source_summary_ar ?? "مصادر مباشرة", en: block.source_summary_en ?? "Direct sources" },
    requiredForCompletion: block.required_for_completion !== false,
    deepSections: (block.deep_sections ?? []).map((section) => ({
      key: section.section_id,
      title: { ar: section.title_ar, en: section.title_en },
      items: { ar: section.content_items_ar, en: section.content_items_en },
      sourceKeys: sourcesForClaims(section.claim_ids),
    })),
  }));
  const quiz: QuizQuestion[] = raw.quiz.questions.map((question, index) => ({
    key: `question-${index + 1}`,
    type: question.type,
    prompt: { ar: question.prompt_ar, en: question.prompt_en },
    options: (question.options ?? question.items ?? question.matching_choices ?? []).map((option) => ({ id: option.id, label: { ar: option.ar, en: option.en } })),
    matchingRows: (question.matching_rows ?? []).map((row) => ({ id: row.id, label: { ar: row.ar, en: row.en } })),
    correctAnswer: question.correct_answer,
    explanation: { ar: question.explanation_ar, en: question.explanation_en },
    depth: question.depth ?? "core",
    reviewCardKey: cardKeyByRawId.get(question.review_card_id ?? "") ?? "card-1",
    reviewDeepSectionKey: question.review_deep_section_id,
  }));
  const glossary: GlossaryTerm[] = raw.glossary.terms.map((term, index) => ({
    key: `term-${index + 1}`,
    term: { ar: term.arabic, en: term.english },
    definition: { ar: term.definition_ar, en: term.definition_en },
  }));
  return {
    slug: "lesson-1",
    number: 1,
    surahName: { ar: "سورة الفاتحة", en: "Surah al-Fatihah" },
    title: { ar: "لماذا سورة الفاتحة سورة فريدة؟", en: "Why Surah al-Fatihah Is Unique" },
    readingTime: { ar: "٥–٧ دقائق", en: "5–7 minutes" },
    blocks,
    sources,
    quiz,
    glossary,
  };
}
