"use client";

import { useEffect, useRef } from "react";
import type { Language, LessonBlock } from "@/content/types";

/**
 * The lesson-stage navigator: one entry per guided card (lesson.blocks), in order. Deep sections are
 * nested inside their parent block and are never rendered as separate stages here; this component only
 * ever receives the top-level blocks array from the adapter, never a flattened deep-section list.
 */
export function LifeTimeline({ blocks, language, currentBlockKey, visitedBlockKeys, onNavigate, compact = false }: {
  blocks: LessonBlock[];
  language: Language;
  currentBlockKey: string;
  visitedBlockKeys: string[];
  onNavigate: (blockKey: string) => void;
  compact?: boolean;
}) {
  const currentRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [currentBlockKey]);

  return (
    <nav className={compact ? "bio-timeline compact" : "bio-timeline"} aria-label={language === "ar" ? "مراحل الفصل" : "Chapter phases"}>
      <span className="eyebrow">{language === "ar" ? "مراحل الفصل" : "Chapter phases"}</span>
      <ol>
        {blocks.map((block, index) => {
          const state = block.key === currentBlockKey ? "current" : visitedBlockKeys.includes(block.key) ? "visited" : "upcoming";
          return (
            <li key={block.key}>
              <button
                type="button"
                ref={state === "current" ? currentRef : undefined}
                data-state={state}
                aria-current={state === "current" ? "step" : undefined}
                onClick={() => onNavigate(block.key)}
              >
                <span className="bio-timeline-dot" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="bio-timeline-copy">
                  <strong>{block.title[language]}</strong>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
