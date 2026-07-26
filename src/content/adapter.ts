import type { GlossaryTerm, Lesson, LessonBlock, QuizQuestion, Source } from "./types";

type RawBlock = {
  block_type: LessonBlock["type"];
  title_ar: string;
  title_en: string;
  content_items_ar: string[];
  content_items_en: string[];
  claim_ids: string[];
};
type RawSource = {
  display_title: string;
  author: string;
  source_role: string[];
  claims_supported: string[];
  locations: { volume: number | null; pdf_page: number; printed_page: number | null }[];
  hadith_numbers: string[];
};
type RawQuestion = {
  type: QuizQuestion["type"];
  prompt_ar: string;
  prompt_en: string;
  options?: { id: string; ar: string; en: string }[] | null;
  items?: { id: string; ar: string; en: string }[] | null;
  correct_answer: string[] | boolean | null;
  explanation_ar: string | null;
  explanation_en: string | null;
};
type RawTerm = { arabic: string; english: string; definition_ar: string; definition_en: string };

const roleLabels: Record<string, string> = {
  revelation_quran: "Qur’an",
  early_tafsir: "Early tafsir",
  later_tafsir: "Tafsir",
  analytical_tafsir: "Analytical tafsir",
  accessible_tafsir: "Accessible tafsir",
  quranic_vocabulary_reference: "Qur’anic vocabulary",
  primary_hadith_collection: "Primary hadith collection",
  hadith_commentary: "Hadith commentary",
  primary_hadith_collection_with_commentary: "Hadith collection with commentary",
};

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
    roles: source.source_role.map((role) => roleLabels[role] ?? role.replaceAll("_", " ")),
    locations: source.locations.map((location) => ({
      volume: location.volume ?? undefined,
      page: location.pdf_page,
      printedPage: location.printed_page ?? undefined,
    })),
    hadithNumbers: source.hadith_numbers,
    reason: sourceReason(source.source_role),
  }));
  const sourceClaims = raw.sources.sources.map((source) => new Set(source.claims_supported));
  const blocks: LessonBlock[] = raw.blocks.blocks.map((block, index) => ({
    key: `block-${index + 1}`,
    type: block.block_type,
    title: { ar: block.title_ar, en: block.title_en },
    items: { ar: block.content_items_ar, en: block.content_items_en },
    sourceKeys: sourceClaims
      .map((claims, sourceIndex) => block.claim_ids.some((claim) => claims.has(claim)) ? sources[sourceIndex].key : null)
      .filter((key): key is string => key !== null),
  }));
  const quiz: QuizQuestion[] = raw.quiz.questions.map((question, index) => ({
    key: `question-${index + 1}`,
    type: question.type,
    prompt: { ar: question.prompt_ar, en: question.prompt_en },
    options: (question.options ?? question.items ?? []).map((option) => ({ id: option.id, label: { ar: option.ar, en: option.en } })),
    correctAnswer: question.correct_answer,
    explanation: { ar: question.explanation_ar, en: question.explanation_en },
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
