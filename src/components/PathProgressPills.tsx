import type { Language } from "@/content/types";
import type { LessonProgressStatus } from "@/lib/sahabah-progress";

const statusText: Record<Language, Record<LessonProgressStatus, string>> = {
  ar: { not_started: "لم يبدأ", in_progress: "قيد التقدم", completed: "مكتمل" },
  en: { not_started: "Not started", in_progress: "In progress", completed: "Completed" },
};

/** Path-level status derived the same way for every path: complete only once every real lesson/chapter in
 * it is complete; in progress once anything has been opened; not started otherwise. */
export function derivePathStatus(completedCount: number, totalCount: number, anyStarted: boolean): LessonProgressStatus {
  if (totalCount > 0 && completedCount >= totalCount) return "completed";
  return anyStarted ? "in_progress" : "not_started";
}

/**
 * Shared two-pill progress pattern used by every path hero (Abu Bakr, Al-Fatihah, and any future path):
 * one semantic status pill, one quantitative count pill. Category-specific wording (the scope noun and the
 * lesson/chapter unit noun) is passed in so each path can keep its own established terminology while the
 * structure, order, and localisation logic stay identical everywhere.
 */
export function PathProgressPills({
  language,
  status,
  completedCount,
  totalCount,
  scopeLabel,
  unitLabel,
}: {
  language: Language;
  status: LessonProgressStatus;
  completedCount: number;
  totalCount: number;
  scopeLabel: Record<Language, string>;
  unitLabel: Record<Language, string>;
}) {
  const countLabel =
    language === "ar"
      ? `${new Intl.NumberFormat("ar").format(completedCount)} من ${new Intl.NumberFormat("ar").format(totalCount)} ${unitLabel.ar} مكتملة`
      : `${completedCount} of ${totalCount} ${unitLabel.en} complete`;
  return (
    <>
      <span className="path-status">{language === "ar" ? `حالة ${scopeLabel.ar}: ${statusText.ar[status]}` : `${scopeLabel.en} status: ${statusText.en[status]}`}</span>
      <span className="path-status path-progress-count" data-testid="path-progress-count">
        {countLabel}
      </span>
    </>
  );
}
