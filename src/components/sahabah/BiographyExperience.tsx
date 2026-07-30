"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BiographyLesson, Language, LessonBlock, Person } from "@/content/types";
import { QuizPlayer } from "@/components/QuizPlayer";
import { AllSourcesButton, SourceBadge, SourceProvider } from "@/components/SourceSystem";
import { CheckIcon, MenuIcon, SourceIcon, UsersIcon } from "@/components/icons";
import {
  ABU_BAKR_LESSON_COUNT,
  abuBakrLessonId,
  emptySahabahProgress,
  parseSahabahProgress,
  SAHABAH_FOCUS_KEY,
  sahabahLessonRequirementsMet,
  sahabahProgressKey,
  sahabahProgressPercent,
  sahabahQuizKey,
  type SahabahProgressState,
} from "@/lib/sahabah-progress";
import { passesQuiz } from "@/lib/progress";
import { trackAnalytics, type PublicLessonSlug } from "@/lib/analytics";
import { useLanguage, LanguageSwitch } from "@/components/LanguageProvider";
import { BiographyBlockRenderer } from "./BiographyBlocks";
import { BiographyHeader } from "./BiographyHeader";
import { LifeTimeline } from "./LifeTimeline";
import { PersonDetail } from "./PersonCard";
import { BottomSheet } from "./Sheets";

const ARABIC_CHAPTER_ORDINALS = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر", "الحادي عشر"];

function CardControls({ index, total, language, onPrevious, onNext }: { index: number; total: number; language: Language; onPrevious: () => void; onNext: () => void }) {
  return (
    <nav className="card-controls bio-controls" aria-label={language === "ar" ? "التنقل بين بطاقات الفصل" : "Chapter card navigation"}>
      <button className="secondary-button" type="button" disabled={index === 0} onClick={onPrevious}>
        {language === "ar" ? "السابق" : "Previous"}
      </button>
      <strong>{language === "ar" ? `${new Intl.NumberFormat("ar").format(index + 1)} من ${new Intl.NumberFormat("ar").format(total)}` : `${index + 1} of ${total}`}</strong>
      <button className="primary-button" type="button" disabled={index === total - 1} onClick={onNext}>
        {language === "ar" ? "التالي" : "Next"}
      </button>
    </nav>
  );
}

export function BiographyExperience({ lesson }: { lesson: BiographyLesson }) {
  const { language } = useLanguage();
  const [progress, setProgress] = useState<SahabahProgressState>(emptySahabahProgress);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [openPerson, setOpenPerson] = useState<Person | null>(null);
  const [openMapBlock, setOpenMapBlock] = useState<LessonBlock | null>(null);
  const hydrated = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const skipPersist = useRef(true);
  const lessonStartTracked = useRef<PublicLessonSlug | null>(null);
  const completionTracked = useRef<PublicLessonSlug | null>(null);
  const requiredIds = useMemo(() => lesson.blocks.filter((block) => block.requiredForCompletion).map((block) => block.key), [lesson.blocks]);
  const progressKey = sahabahProgressKey(lesson.number);
  const quizKey = sahabahQuizKey(lesson.number);
  const lessonId = abuBakrLessonId(lesson.number);
  const analyticsLessonSlug: PublicLessonSlug | null = lesson.number === 1 ? "abu-bakr-lesson-1" : lesson.number === 2 ? "abu-bakr-lesson-2" : null;
  const isLastLesson = lesson.number >= ABU_BAKR_LESSON_COUNT;

  useEffect(() => {
    const restored = parseSahabahProgress(localStorage.getItem(progressKey));
    const sessionFocus = sessionStorage.getItem(SAHABAH_FOCUS_KEY) === "true";
    const initialBlock = lesson.blocks.some((block) => block.key === restored.currentBlockId) ? restored.currentBlockId : "block-1";
    completionTracked.current = restored.lessonCompleted ? analyticsLessonSlug : null;
    if (analyticsLessonSlug && !restored.lessonOpened && lessonStartTracked.current !== analyticsLessonSlug) {
      lessonStartTracked.current = analyticsLessonSlug;
      const storedLanguage = localStorage.getItem("islamic-library-language");
      trackAnalytics("lesson_start", { lesson_slug: analyticsLessonSlug, language: storedLanguage === "en" ? "en" : "ar" });
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress({ ...restored, currentBlockId: initialBlock, visitedBlockIds: [...new Set([...restored.visitedBlockIds, initialBlock])], lessonOpened: true, focusMode: sessionFocus, lastVisitedAt: Date.now() });
    hydrated.current = true;
    // Resetting hydration guards when the lesson (route) itself changes, not just its blocks.
  }, [analyticsLessonSlug, lesson.number, lesson.blocks, progressKey]);
  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    if (hydrated.current) localStorage.setItem(progressKey, JSON.stringify(progress));
  }, [progress, progressKey]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress((current) => (current.preferredLanguage === language ? current : { ...current, preferredLanguage: language }));
  }, [language]);
  useEffect(() => {
    const reset = () => {
      setProgress({ ...emptySahabahProgress, lessonOpened: true, visitedBlockIds: ["block-1"], lastVisitedAt: Date.now() });
      sessionStorage.removeItem(SAHABAH_FOCUS_KEY);
    };
    window.addEventListener("prototype-progress-reset", reset);
    return () => window.removeEventListener("prototype-progress-reset", reset);
  }, []);
  useEffect(() => {
    if (!analyticsLessonSlug || !hydrated.current || !progress.lessonCompleted || completionTracked.current === analyticsLessonSlug) return;
    completionTracked.current = analyticsLessonSlug;
    trackAnalytics("lesson_complete", { lesson_slug: analyticsLessonSlug, language });
  }, [analyticsLessonSlug, language, progress.lessonCompleted]);

  const currentIndex = Math.max(0, lesson.blocks.findIndex((block) => block.key === progress.currentBlockId));
  const currentBlock = lesson.blocks[currentIndex];
  const percent = sahabahProgressPercent(progress, lesson.blocks.length);

  const navigate = useCallback(
    (key: string, deepSectionKey?: string) => {
      const index = lesson.blocks.findIndex((block) => block.key === key);
      if (index < 0) return;
      setProgress((current) => ({
        ...current,
        currentBlockId: key,
        visitedBlockIds: [...new Set([...current.visitedBlockIds, key])],
        expandedDeepSectionIds: deepSectionKey ? [...new Set([...current.expandedDeepSectionIds, deepSectionKey])] : current.expandedDeepSectionIds,
      }));
      window.requestAnimationFrame(() => {
        stageRef.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        stageRef.current?.focus({ preventScroll: true });
      });
    },
    [lesson.blocks],
  );
  const toggleDeep = useCallback(
    (id: string, open: boolean) =>
      setProgress((current) => {
        const has = current.expandedDeepSectionIds.includes(id);
        if (has === open) return current;
        return { ...current, expandedDeepSectionIds: open ? [...current.expandedDeepSectionIds, id] : current.expandedDeepSectionIds.filter((item) => item !== id) };
      }),
    [],
  );
  const onAttempt = useCallback(
    (score: number, total: number) => {
      setProgress((current) => {
        const quizPassed = current.quizPassed || passesQuiz(score, total);
        const next = { ...current, quizAttempts: current.quizAttempts + 1, bestQuizScore: Math.max(current.bestQuizScore, score / total), quizSubmitted: true, quizPassed };
        const complete = sahabahLessonRequirementsMet(next, requiredIds);
        return { ...next, lessonCompleted: complete, completedLessonIds: complete ? [...new Set([...next.completedLessonIds, lessonId])] : next.completedLessonIds };
      });
    },
    [requiredIds, lessonId],
  );

  const quizBlock = lesson.blocks.at(-1)!;
  const arabicOrdinal = ARABIC_CHAPTER_ORDINALS[lesson.number - 1] ?? String(lesson.number);
  const labels =
    language === "ar"
      ? {
          sahabah: "الصحابة",
          companion: lesson.personName.ar,
          chapter: `الفصل ${arabicOrdinal}`,
          progress: "تقدم الفصل",
          sources: "المصادر",
          people: "الأشخاص",
          openTimeline: "مراحل الفصل",
          finishTitle: "أتممت الفصل بنجاح",
          finishBody: isLastLesson
            ? `اكتمل الفصل ${arabicOrdinal}، وهو الفصل الأخير في مسار السيرة المتاح حاليًا.`
            : `اكتمل الفصل ${arabicOrdinal}. ما يزال مسار سيرة أبي بكر قيد التقدم.`,
          review: "راجع الفصل",
          nextChapter: "الفصل التالي",
          pathOverview: "مسار السيرة الكامل",
          pathComplete: "لا مزيد من الفصول المتاحة بعد",
        }
      : {
          sahabah: "Sahabah",
          companion: lesson.personName.en,
          chapter: `Chapter ${lesson.number}`,
          progress: "Chapter progress",
          sources: "Sources",
          people: "People",
          openTimeline: "Chapter phases",
          finishTitle: "Chapter completed",
          finishBody: isLastLesson
            ? `Chapter ${lesson.number} is complete — the last chapter currently available in the path.`
            : `Chapter ${lesson.number} is complete. The Abu Bakr biography path remains in progress.`,
          review: "Review chapter",
          nextChapter: "Next chapter",
          pathOverview: "Full biography path",
          pathComplete: "No further chapters available yet",
        };

  const currentPeople = currentBlock.meta?.people ?? [];

  return (
    <SourceProvider
      sources={lesson.sources}
      analyticsContext={analyticsLessonSlug ? { lessonSlug: analyticsLessonSlug, cardIndex: currentIndex + 1, cardCount: lesson.blocks.length } : undefined}
    >
      <div className="bio-lesson">
        <nav className="lesson-progress-sticky bio-progress-bar" aria-label={labels.progress}>
          <div className="shell">
            <button className="mobile-navigator-button" type="button" onClick={() => setTimelineOpen(true)}>
              <MenuIcon />
              {labels.openTimeline}
            </button>
            <div className="progress-copy">
              <span>{labels.chapter}</span>
              <strong>{percent}%</strong>
            </div>
            <div className="progress-track">
              <i style={{ width: `${percent}%` }} />
            </div>
          </div>
        </nav>
        <main className="lesson-page bio-page">
          <div className="shell bio-shell">
            <aside className="lesson-toc bio-toc" aria-label={language === "ar" ? "مراحل الفصل" : "Chapter phases"}>
              <LifeTimeline blocks={lesson.blocks} language={language} currentBlockKey={currentBlock.key} visitedBlockKeys={progress.visitedBlockIds} onNavigate={navigate} />
            </aside>
            <div className="reading-column bio-reading-column">
              <BiographyHeader lesson={lesson} language={language} />
              <div className="lesson-header-actions bio-header-actions">
                <LanguageSwitch />
                <AllSourcesButton count={lesson.sources.length} />
              </div>
              <nav className="breadcrumbs bio-breadcrumbs" aria-label={language === "ar" ? "مسار الصفحة" : "Breadcrumb"}>
                <Link href="/sahabah">{labels.sahabah}</Link>
                <span>/</span>
                <Link href="/sahabah/abu-bakr">{labels.companion}</Link>
                <span>/</span>
                <span>{labels.chapter}</span>
              </nav>
              <div className="guided-card-stage bio-stage" ref={stageRef} tabIndex={-1} aria-live="polite" data-current-card={currentBlock.key}>
                {currentBlock.type !== "quiz_sources" ? (
                  <BiographyBlockRenderer
                    block={currentBlock}
                    language={language}
                    expandedDeepIds={progress.expandedDeepSectionIds}
                    onToggleDeep={toggleDeep}
                    onOpenPerson={setOpenPerson}
                    onOpenMap={setOpenMapBlock}
                  />
                ) : (
                  <section id={quizBlock.key} className="lesson-block quiz-section" aria-labelledby="bio-quiz-title">
                    <header className="block-heading">
                      <div>
                        <span className="eyebrow">{labels.chapter}</span>
                        <h2 id="bio-quiz-title">{quizBlock.title[language]}</h2>
                      </div>
                      <SourceBadge sourceKeys={quizBlock.sourceKeys} label={quizBlock.sourceSummary[language]} />
                    </header>
                    <p className="quiz-intro">{quizBlock.items[language][0]}</p>
                    <QuizPlayer questions={lesson.quiz} language={language} onAttempt={onAttempt} onReview={navigate} storageKey={quizKey} analyticsLessonSlug={analyticsLessonSlug ?? undefined} />
                  </section>
                )}
                <CardControls index={currentIndex} total={lesson.blocks.length} language={language} onPrevious={() => navigate(lesson.blocks[currentIndex - 1].key)} onNext={() => navigate(lesson.blocks[currentIndex + 1].key)} />
              </div>
              {progress.lessonCompleted && (
                <section className="completion-card lesson-only-completion" data-testid="lesson-completed">
                  <div className="completion-icon">
                    <CheckIcon />
                  </div>
                  <div>
                    <h2>{labels.finishTitle}</h2>
                    <p>{labels.finishBody}</p>
                    <div className="completion-actions">
                      <button type="button" className="secondary-button" onClick={() => navigate("block-1")}>
                        {labels.review}
                      </button>
                      <Link href="/sahabah/abu-bakr" className="secondary-button">
                        {labels.pathOverview}
                      </Link>
                      {isLastLesson ? (
                        <button type="button" className="primary-button" disabled>
                          {labels.pathComplete}
                        </button>
                      ) : (
                        <Link href={`/sahabah/abu-bakr/lesson-${lesson.number + 1}`} className="primary-button">
                          {labels.nextChapter}
                        </Link>
                      )}
                    </div>
                  </div>
                </section>
              )}
            </div>
            <aside className="source-rail bio-context-rail" aria-label={language === "ar" ? "الأشخاص والمصادر" : "People and sources"}>
              <div>
                <SourceIcon />
                <span className="eyebrow">{labels.sources}</span>
                <h2>{currentBlock.sourceSummary[language]}</h2>
                <SourceBadge sourceKeys={currentBlock.sourceKeys} />
              </div>
              {currentPeople.length > 0 && (
                <div className="bio-rail-people">
                  <UsersIcon />
                  <span className="eyebrow">{labels.people}</span>
                  <ul>
                    {currentPeople.map((person) => (
                      <li key={person.key}>
                        <button type="button" onClick={() => setOpenPerson(person)}>
                          {person.name[language]}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        </main>
        <BottomSheet open={timelineOpen} onClose={() => setTimelineOpen(false)} titleId="bio-timeline-drawer-title" title={labels.openTimeline}>
          <LifeTimeline
            blocks={lesson.blocks}
            language={language}
            currentBlockKey={currentBlock.key}
            visitedBlockKeys={progress.visitedBlockIds}
            compact
            onNavigate={(key) => {
              navigate(key);
              setTimelineOpen(false);
            }}
          />
        </BottomSheet>
        <BottomSheet open={openPerson !== null} onClose={() => setOpenPerson(null)} titleId="bio-person-sheet-title" title={openPerson?.name[language] ?? ""}>
          {openPerson && <PersonDetail person={openPerson} language={language} />}
        </BottomSheet>
        <BottomSheet open={openMapBlock !== null} onClose={() => setOpenMapBlock(null)} titleId="bio-map-sheet-title" title={openMapBlock?.title[language] ?? ""} variant="fullscreen">
          {openMapBlock && (
            <div className="bio-map-frame bio-map-frame-full">
              {(openMapBlock.meta?.mapPins ?? []).map((pin) => (
                <span className="bio-map-pin" key={pin.key} style={{ insetInlineStart: `${pin.x}%`, top: `${pin.y}%` }} title={pin.label[language]}>
                  <span className="bio-map-pin-dot" aria-hidden="true" />
                  <small>{pin.label[language]}</small>
                </span>
              ))}
            </div>
          )}
        </BottomSheet>
      </div>
    </SourceProvider>
  );
}
