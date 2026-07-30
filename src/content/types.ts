export type Language = "ar" | "en";

export type Subject = {
  slug: string;
  label: Record<Language, string>;
  active: boolean;
};

export type Surah = {
  slug: string;
  number: number;
  name: Record<Language, string>;
  verses: number;
  availability: "active" | "preview";
};

export type PathLesson = {
  slug: string;
  number: number;
  title: Record<Language, string>;
  state: "active" | "planned";
};

export type SourceLocation = {
  volume?: number;
  page: number;
  printedPage?: number;
};

export type Source = {
  key: string;
  title: string;
  author: string;
  roleCodes: string[];
  supportLevel: "primary_evidence" | "direct_commentary" | "supporting_tafsir" | "broader_comparative_support";
  locations: SourceLocation[];
  scriptureReferences: Record<Language, string>[];
  hadithNumbers: string[];
  reason: Record<Language, string>;
};

export type LessonBlockType =
  | "lesson_hook"
  | "surah_facts"
  | "key_evidence"
  | "name_cards"
  | "seven_oft_repeated"
  | "hadith_conversation"
  | "theme_journey"
  | "reflection"
  | "summary"
  | "quiz_sources"
  | "event_card"
  | "person_card"
  | "relationship_card"
  | "family_tree"
  | "quotation_card"
  | "quran_connection"
  | "hadith_evidence"
  | "place_card"
  | "map_block"
  | "chronology_clarification"
  | "established_vs_reported"
  | "character_theme"
  | "leadership_decision"
  | "timeline_review";

export type LessonBlock = {
  key: string;
  type: LessonBlockType;
  title: Record<Language, string>;
  items: Record<Language, string[]>;
  sourceKeys: string[];
  sourceSummary: Record<Language, string>;
  deepSections: DeepSection[];
  requiredForCompletion: boolean;
  /** Structured, block-type-specific data (people, family trees, map pins…) that a plain items[] list cannot express. Unused by Qur'an blocks. */
  meta?: BiographyBlockMeta;
};

// --- Sahabah / biography domain types (additive; unused by the Qur'an prototype) ---

export type Person = {
  key: string;
  name: Record<Language, string>;
  kunyah?: Record<Language, string>;
  relation: Record<Language, string>;
  note: Record<Language, string>;
};

export type PlaceEntry = {
  key: string;
  name: Record<Language, string>;
  description: Record<Language, string>;
};

export type MapPin = {
  key: string;
  label: Record<Language, string>;
  x: number;
  y: number;
};

export type FamilyNode = {
  key: string;
  name: Record<Language, string>;
  role: Record<Language, string>;
  children: FamilyNode[];
};

export type TimelinePhase = {
  key: string;
  label: Record<Language, string>;
  dateLabel: Record<Language, string>;
  summary: Record<Language, string>;
  blockKey: string;
};

export type BiographyBlockMeta = {
  people?: Person[];
  places?: PlaceEntry[];
  mapPins?: MapPin[];
  familyTree?: FamilyNode;
};

export type BiographyLesson = {
  canonicalSlug: import("./abu_bakr/identity").AbuBakrCanonicalSlug;
  slug: string;
  number: number;
  personName: Record<Language, string>;
  title: Record<Language, string>;
  readingTime: Record<Language, string>;
  /** True once this lesson's 4 content files hold real (non-placeholder) drafted content. */
  contentReady: boolean;
  timelinePhases: TimelinePhase[];
  blocks: LessonBlock[];
  sources: Source[];
  quiz: QuizQuestion[];
  glossary: GlossaryTerm[];
};

export type Companion = {
  slug: string;
  name: Record<Language, string>;
  title: Record<Language, string>;
  availability: "active" | "preview";
};

export type BiographyChapter = {
  canonicalSlug: import("./abu_bakr/identity").AbuBakrCanonicalSlug;
  slug: string;
  number: number;
  title: Record<Language, string>;
  description: Record<Language, string>;
  state: "active" | "planned";
  /** True once this chapter's content is a real (non-placeholder) draft. Defaults to false. */
  contentReady?: boolean;
};

export type DeepSection = {
  key: string;
  title: Record<Language, string>;
  items: Record<Language, string[]>;
  sourceKeys: string[];
};

export type QuizOption = { id: string; label: Record<Language, string> };
export type QuizQuestionType = "multiple_choice" | "select_all" | "ordering" | "true_false" | "matching" | "scenario";
export type MatchingRow = { id: string; label: Record<Language, string> };
export type QuizQuestion = {
  key: string;
  type: QuizQuestionType;
  prompt: Record<Language, string>;
  options: QuizOption[];
  matchingRows: MatchingRow[];
  correctAnswer: string[] | boolean;
  explanation: Record<Language, string | null>;
  depth: "core" | "deep";
  reviewCardKey: string;
  reviewDeepSectionKey?: string;
};

export type GlossaryTerm = {
  key: string;
  term: Record<Language, string>;
  definition: Record<Language, string>;
};

export type Lesson = {
  slug: string;
  number: number;
  surahName: Record<Language, string>;
  title: Record<Language, string>;
  readingTime: Record<Language, string>;
  blocks: LessonBlock[];
  sources: Source[];
  quiz: QuizQuestion[];
  glossary: GlossaryTerm[];
};

export type ProgressState = {
  version: 3;
  lessonOpened: boolean;
  currentCardId: string;
  visitedCardIds: string[];
  expandedDeepSectionIds: string[];
  quizAttempts: number;
  bestQuizScore: number;
  quizSubmitted: boolean;
  quizPassed: boolean;
  lessonCompleted: boolean;
  completedLessonIds: string[];
  preferredLanguage: Language;
  focusMode: boolean;
  /** Epoch ms of the most recent time this lesson was opened. 0 for progress saved before this field existed. */
  lastVisitedAt: number;
};
