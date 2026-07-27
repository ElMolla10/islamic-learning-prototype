import type { Language } from "@/content/types";
import { abuBakrPath, fatihahPath } from "@/content/catalogue";
import { LESSON_ID, parseProgress, progressPercent, PROGRESS_KEY } from "./progress";
import { abuBakrLessonId, parseSahabahProgress, sahabahProgressKey, sahabahProgressPercent, type LessonProgressStatus } from "./sahabah-progress";

/**
 * Block counts for the two lessons that currently have real, navigable content. There is no shared
 * client-side loader for full lesson content (it's fetched server-side per route), so these mirror the
 * known block count of each lesson's own JSON rather than re-fetching it just to compute a percentage.
 */
const AL_FATIHAH_LESSON_1_BLOCK_COUNT = 10;
const ABU_BAKR_LESSON_1_BLOCK_COUNT = 10;

/** Deterministic tie-break order used only when two candidates have equal (including missing) timestamps. */
const DETERMINISTIC_ORDER = [LESSON_ID, abuBakrLessonId(1)];

export type ContinueMode = "start" | "continue" | "review";

export type ContinueRecommendation = {
  mode: ContinueMode;
  route: string;
  category: Record<Language, string>;
  title: Record<Language, string>;
  actionLabel: Record<Language, string>;
  subtitle: Record<Language, string>;
};

type Candidate = {
  id: string;
  status: LessonProgressStatus;
  lastVisitedAt: number;
  percent: number;
  route: string;
  category: Record<Language, string>;
  title: Record<Language, string>;
};

function readFatihahCandidate(): Candidate | null {
  const lesson = fatihahPath.find((item) => item.state === "active" && item.number === 1);
  if (!lesson) return null;
  const raw = typeof window === "undefined" ? null : window.localStorage.getItem(PROGRESS_KEY);
  const progress = parseProgress(raw);
  const status: LessonProgressStatus = progress.completedLessonIds.includes(LESSON_ID) ? "completed" : progress.lessonOpened ? "in_progress" : "not_started";
  return {
    id: LESSON_ID,
    status,
    lastVisitedAt: progress.lastVisitedAt,
    percent: progressPercent(progress, AL_FATIHAH_LESSON_1_BLOCK_COUNT),
    route: "/quran/al-fatihah/lesson-1",
    category: { ar: "القرآن", en: "Qur’an" },
    title: lesson.title,
  };
}

function readAbuBakrCandidate(): Candidate | null {
  const chapter = abuBakrPath.find((item) => item.state === "active" && item.number === 1);
  if (!chapter) return null;
  const id = abuBakrLessonId(1);
  const raw = typeof window === "undefined" ? null : window.localStorage.getItem(sahabahProgressKey(1));
  const progress = parseSahabahProgress(raw);
  const status: LessonProgressStatus = progress.lessonCompleted ? "completed" : progress.lessonOpened ? "in_progress" : "not_started";
  return {
    id,
    status,
    lastVisitedAt: progress.lastVisitedAt,
    percent: sahabahProgressPercent(progress, ABU_BAKR_LESSON_1_BLOCK_COUNT),
    route: "/sahabah/abu-bakr/lesson-1",
    category: { ar: "السيرة", en: "Biography" },
    title: chapter.title,
  };
}

function byRecencyThenDeterministicOrder(a: Candidate, b: Candidate) {
  return b.lastVisitedAt - a.lastVisitedAt || DETERMINISTIC_ORDER.indexOf(a.id) - DETERMINISTIC_ORDER.indexOf(b.id);
}
function byDeterministicOrder(a: Candidate, b: Candidate) {
  return DETERMINISTIC_ORDER.indexOf(a.id) - DETERMINISTIC_ORDER.indexOf(b.id);
}

/**
 * Selection algorithm (see designer_mode_audit findings #2):
 * 1. Any in-progress lesson wins, most recently visited first (deterministic tie-break if timestamps
 *    are equal/missing) — this also covers "one completed + one in-progress" since completed lessons
 *    are never in this bucket.
 * 2. Otherwise, if something is completed AND something else is not yet started, recommend the
 *    not-yet-started one (a natural "what's next" prompt).
 * 3. Otherwise, if something is completed (and nothing new to start), offer to review the most
 *    recently completed lesson.
 * 4. Otherwise (nothing started anywhere), fall back to the first not-started candidate in
 *    deterministic order — an intentional default recommendation for a brand-new learner.
 */
function pick(candidates: Candidate[]): { candidate: Candidate; mode: ContinueMode } | null {
  const inProgress = candidates.filter((candidate) => candidate.status === "in_progress").sort(byRecencyThenDeterministicOrder);
  if (inProgress.length > 0) return { candidate: inProgress[0], mode: "continue" };

  const completed = candidates.filter((candidate) => candidate.status === "completed").sort(byRecencyThenDeterministicOrder);
  const notStarted = candidates.filter((candidate) => candidate.status === "not_started").sort(byDeterministicOrder);

  if (completed.length > 0 && notStarted.length > 0) return { candidate: notStarted[0], mode: "start" };
  if (completed.length > 0) return { candidate: completed[0], mode: "review" };
  if (notStarted.length > 0) return { candidate: notStarted[0], mode: "start" };
  return null;
}

const actionLabels: Record<ContinueMode, Record<Language, string>> = {
  start: { ar: "ابدأ التعلّم", en: "Start learning" },
  continue: { ar: "تابع التعلّم", en: "Continue learning" },
  review: { ar: "راجع الدرس", en: "Review lesson" },
};

function subtitleFor(mode: ContinueMode, percent: number): Record<Language, string> {
  if (mode === "continue") return { ar: `${new Intl.NumberFormat("ar").format(percent)}٪ مكتمل`, en: `${percent}% complete` };
  if (mode === "review") return { ar: "أتممت هذا الدرس بالفعل", en: "You already completed this lesson" };
  return { ar: "ابدأ هذا الدرس الآن", en: "Start this lesson now" };
}

/** Client-only: reads live progress from localStorage, so must be called after mount (see ContinueLearningCard). */
export function getContinueRecommendation(): ContinueRecommendation {
  const candidates = [readFatihahCandidate(), readAbuBakrCandidate()].filter((candidate): candidate is Candidate => candidate !== null);
  const picked = pick(candidates);
  const fallback = candidates.find((candidate) => candidate.id === DETERMINISTIC_ORDER[0]) ?? candidates[0];
  const { candidate, mode } = picked ?? { candidate: fallback, mode: "start" as ContinueMode };

  return {
    mode,
    route: candidate.route,
    category: candidate.category,
    title: candidate.title,
    actionLabel: actionLabels[mode],
    subtitle: subtitleFor(mode, candidate.percent),
  };
}
