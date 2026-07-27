"use client";

import type { Language, TimelinePhase } from "@/content/types";

export function LifeTimeline({ phases, language, currentBlockKey, visitedBlockKeys, onNavigate, compact = false }: {
  phases: TimelinePhase[];
  language: Language;
  currentBlockKey: string;
  visitedBlockKeys: string[];
  onNavigate: (blockKey: string) => void;
  compact?: boolean;
}) {
  return (
    <nav className={compact ? "bio-timeline compact" : "bio-timeline"} aria-label={language === "ar" ? "الخط الزمني للفصل" : "Chapter timeline"}>
      <span className="eyebrow">{language === "ar" ? "مراحل الفصل" : "Chapter phases"}</span>
      <ol>
        {phases.map((phase) => {
          const state = phase.blockKey === currentBlockKey ? "current" : visitedBlockKeys.includes(phase.blockKey) ? "visited" : "upcoming";
          return (
            <li key={phase.key}>
              <button type="button" data-state={state} aria-current={state === "current" ? "step" : undefined} onClick={() => onNavigate(phase.blockKey)}>
                <span className="bio-timeline-dot" aria-hidden="true" />
                <span className="bio-timeline-copy">
                  <small>{phase.dateLabel[language]}</small>
                  <strong>{phase.label[language]}</strong>
                  <span>{phase.summary[language]}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
