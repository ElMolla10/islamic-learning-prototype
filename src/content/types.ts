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
  roles: string[];
  locations: SourceLocation[];
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
  | "quiz_sources";

export type LessonBlock = {
  key: string;
  type: LessonBlockType;
  title: Record<Language, string>;
  items: Record<Language, string[]>;
  sourceKeys: string[];
};

export type QuizOption = { id: string; label: Record<Language, string> };
export type QuizQuestionType = "multiple_choice" | "select_all" | "ordering" | "true_false" | "short_recall";
export type QuizQuestion = {
  key: string;
  type: QuizQuestionType;
  prompt: Record<Language, string>;
  options: QuizOption[];
  correctAnswer: string[] | boolean | null;
  explanation: Record<Language, string | null>;
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
  lessonOpened: boolean;
  viewedBlocks: string[];
  quizCompleted: boolean;
  lessonCompleted: boolean;
};
