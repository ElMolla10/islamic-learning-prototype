import type { BiographyLesson, FamilyNode, GlossaryTerm, LessonBlock, MapPin, PlaceEntry, Person, QuizQuestion, Source, TimelinePhase } from "../types";
import type { AbuBakrCanonicalSlug } from "./identity";

type RawDeepSection = {
  section_id: string;
  title_ar: string;
  title_en: string;
  content_items_ar: string[];
  content_items_en: string[];
  claim_ids: string[];
};

type RawPerson = { person_id: string; name_ar: string; name_en: string; kunyah_ar?: string; kunyah_en?: string; relation_ar: string; relation_en: string; note_ar: string; note_en: string };
type RawPlace = { place_id: string; name_ar: string; name_en: string; description_ar: string; description_en: string };
type RawMapPin = { pin_id: string; label_ar: string; label_en: string; x: number; y: number };
type RawFamilyNode = { node_id: string; name_ar: string; name_en: string; role_ar: string; role_en: string; children: RawFamilyNode[] };

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
  deep_sections?: RawDeepSection[];
  people?: RawPerson[];
  places?: RawPlace[];
  map_pins?: RawMapPin[];
  family_tree?: RawFamilyNode;
};

type RawTimelinePhase = {
  phase_id: string;
  label_ar: string;
  label_en: string;
  date_label_ar: string;
  date_label_en: string;
  summary_ar: string;
  summary_en: string;
  block_id: string;
};

type RawSourceLocation = { volume: number | null; pdf_page: number; printed_page: number | null; claims_supported?: string[] };
type RawSource = {
  display_title: string;
  author: string;
  source_role: string[];
  /**
   * Some content batches record claims_supported once per source (flat); others (e.g. a single dedicated
   * biography spanning many pages) record it per location instead, since different pages of the same work
   * support different claims. Support both: prefer the flat field, else union across locations.
   */
  claims_supported?: string[];
  locations: RawSourceLocation[];
  hadith_numbers?: string[];
  scripture_references?: { ar: string; en: string }[];
};

type RawQuestion = {
  question_id: string;
  type: QuizQuestion["type"];
  prompt_ar: string;
  prompt_en: string;
  options?: { id: string; ar: string; en: string }[] | null;
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
  if (roles.some((role) => role === "revelation_quran" || role === "primary_hadith_collection" || role === "dedicated_biography" || role === "early_narrative_history")) return "primary_evidence";
  if (roles.some((role) => role === "hadith_commentary" || role === "primary_hadith_collection_with_commentary")) return "direct_commentary";
  if (roles.some((role) => role.includes("tafsir"))) return "supporting_tafsir";
  return "broader_comparative_support";
}

function claimsSupportedFor(source: RawSource): string[] {
  if (source.claims_supported) return source.claims_supported;
  return [...new Set(source.locations.flatMap((location) => location.claims_supported ?? []))];
}

function sourceReason(roles: string[]): Record<"ar" | "en", string> {
  if (roles.includes("primary_hadith_collection")) return { ar: "للتحقق من نص الحديث وموضعه في المصدر الأصلي.", en: "Used to verify the hadith wording and its location in the primary collection." };
  if (roles.includes("hadith_commentary")) return { ar: "لفهم لفظ الحديث وسياقه كما شرحه أهل العلم.", en: "Used to understand the hadith wording and context through commentary." };
  return { ar: "لدعم سرد السيرة من مصدر متحقق الموضع.", en: "Used to support the biography narrative from a verified source location." };
}

function toPerson(raw: RawPerson): Person {
  return {
    key: raw.person_id,
    name: { ar: raw.name_ar, en: raw.name_en },
    kunyah: raw.kunyah_ar && raw.kunyah_en ? { ar: raw.kunyah_ar, en: raw.kunyah_en } : undefined,
    relation: { ar: raw.relation_ar, en: raw.relation_en },
    note: { ar: raw.note_ar, en: raw.note_en },
  };
}

function toPlace(raw: RawPlace): PlaceEntry {
  return { key: raw.place_id, name: { ar: raw.name_ar, en: raw.name_en }, description: { ar: raw.description_ar, en: raw.description_en } };
}

function toMapPin(raw: RawMapPin): MapPin {
  return { key: raw.pin_id, label: { ar: raw.label_ar, en: raw.label_en }, x: raw.x, y: raw.y };
}

function toFamilyNode(raw: RawFamilyNode): FamilyNode {
  return { key: raw.node_id, name: { ar: raw.name_ar, en: raw.name_en }, role: { ar: raw.role_ar, en: raw.role_en }, children: raw.children.map(toFamilyNode) };
}

export function adaptBiographyLesson(raw: {
  meta: { canonicalSlug: AbuBakrCanonicalSlug; slug: string; number: number; personName: Record<"ar" | "en", string>; title: Record<"ar" | "en", string>; readingTime: Record<"ar" | "en", string>; contentReady?: boolean };
  blocks: { blocks: RawBlock[]; timeline_phases: RawTimelinePhase[] };
  quiz: { questions: RawQuestion[] };
  sources: { sources: RawSource[] };
  glossary: { terms: RawTerm[] };
}): BiographyLesson {
  const sources: Source[] = raw.sources.sources.map((source, index) => ({
    key: `source-${index + 1}`,
    title: source.display_title,
    author: source.author,
    roleCodes: [...source.source_role],
    supportLevel: supportLevel(source.source_role),
    locations: source.locations.map((location) => ({ volume: location.volume ?? undefined, page: location.pdf_page, printedPage: location.printed_page ?? undefined })),
    scriptureReferences: (source.scripture_references ?? []).map((reference) => ({ ar: reference.ar, en: reference.en })),
    hadithNumbers: source.hadith_numbers ?? [],
    reason: sourceReason(source.source_role),
  }));
  const sourceClaims = raw.sources.sources.map((source) => new Set(claimsSupportedFor(source)));
  const sourcesForClaims = (claimIds: string[]) =>
    sourceClaims.map((claims, sourceIndex) => (claimIds.some((claim) => claims.has(claim)) ? sources[sourceIndex].key : null)).filter((key): key is string => key !== null);

  const blockKeyByRawId = new Map(raw.blocks.blocks.map((block, index) => [block.block_id, `block-${index + 1}`]));

  const blocks: LessonBlock[] = raw.blocks.blocks.map((block, index) => ({
    key: `block-${index + 1}`,
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
    meta:
      block.people || block.places || block.map_pins || block.family_tree
        ? {
            people: block.people?.map(toPerson),
            places: block.places?.map(toPlace),
            mapPins: block.map_pins?.map(toMapPin),
            familyTree: block.family_tree ? toFamilyNode(block.family_tree) : undefined,
          }
        : undefined,
  }));

  const timelinePhases: TimelinePhase[] = raw.blocks.timeline_phases.map((phase) => ({
    key: phase.phase_id,
    label: { ar: phase.label_ar, en: phase.label_en },
    dateLabel: { ar: phase.date_label_ar, en: phase.date_label_en },
    summary: { ar: phase.summary_ar, en: phase.summary_en },
    blockKey: blockKeyByRawId.get(phase.block_id) ?? "block-1",
  }));

  const quiz: QuizQuestion[] = raw.quiz.questions.map((question, index) => ({
    key: `question-${index + 1}`,
    type: question.type,
    prompt: { ar: question.prompt_ar, en: question.prompt_en },
    options: (question.options ?? question.matching_choices ?? []).map((option) => ({ id: option.id, label: { ar: option.ar, en: option.en } })),
    matchingRows: (question.matching_rows ?? []).map((row) => ({ id: row.id, label: { ar: row.ar, en: row.en } })),
    correctAnswer: question.correct_answer,
    explanation: { ar: question.explanation_ar, en: question.explanation_en },
    depth: question.depth ?? "core",
    reviewCardKey: blockKeyByRawId.get(question.review_card_id ?? "") ?? "block-1",
    reviewDeepSectionKey: question.review_deep_section_id,
  }));

  const glossary: GlossaryTerm[] = raw.glossary.terms.map((term, index) => ({
    key: `term-${index + 1}`,
    term: { ar: term.arabic, en: term.english },
    definition: { ar: term.definition_ar, en: term.definition_en },
  }));

  return { canonicalSlug: raw.meta.canonicalSlug, slug: raw.meta.slug, number: raw.meta.number, personName: raw.meta.personName, title: raw.meta.title, readingTime: raw.meta.readingTime, contentReady: raw.meta.contentReady ?? false, timelinePhases, blocks, sources, quiz, glossary };
}
