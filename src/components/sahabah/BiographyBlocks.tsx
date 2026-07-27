"use client";

import { LessonBlockRenderer } from "@/components/LessonBlocks";
import { SourceBadge } from "@/components/SourceSystem";
import { ChevronDownIcon, MapIcon } from "@/components/icons";
import type { FamilyNode, Language, LessonBlock, Person } from "@/content/types";
import { PersonCard } from "./PersonCard";

type BlockProps = {
  block: LessonBlock;
  language: Language;
  expandedDeepIds: string[];
  onToggleDeep: (id: string, open: boolean) => void;
  onOpenPerson?: (person: Person) => void;
  onOpenMap?: (block: LessonBlock) => void;
};

const genericTypes: LessonBlock["type"][] = ["lesson_hook", "surah_facts", "key_evidence", "name_cards", "seven_oft_repeated", "hadith_conversation", "theme_journey", "reflection", "summary"];

function BiographyBlockShell({ block, language, children, className = "", expandedDeepIds, onToggleDeep }: BlockProps & { children: React.ReactNode; className?: string }) {
  return (
    <section id={block.key} data-block-key={block.key} data-block-type={block.type} className={`lesson-block bio-block ${className}`} aria-labelledby={`${block.key}-title`}>
      <header className="block-heading">
        <div>
          <span className="eyebrow">{language === "ar" ? "الفكرة الأساسية" : "Core idea"}</span>
          <h2 id={`${block.key}-title`}>{block.title[language]}</h2>
        </div>
        <SourceBadge sourceKeys={block.sourceKeys} label={block.sourceSummary[language]} />
      </header>
      {children}
      {block.deepSections.length > 0 && (
        <div className="deep-section-list" data-testid="deep-sections">
          {block.deepSections.map((section) => (
            <details className="deep-section" key={section.key} open={expandedDeepIds.includes(section.key)} onToggle={(event) => onToggleDeep(section.key, event.currentTarget.open)}>
              <summary>
                <span>
                  <small>{language === "ar" ? "تعمّق أكثر" : "Go deeper"}</small>
                  <strong>{section.title[language]}</strong>
                </span>
                <ChevronDownIcon />
              </summary>
              <div className="deep-section-body">
                <div className="prose">
                  {section.items[language].map((item, index) => (
                    <p key={index}>{item}</p>
                  ))}
                </div>
                <SourceBadge sourceKeys={section.sourceKeys} label={language === "ar" ? "مصادر هذا التعمق" : "Sources for this insight"} />
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
const paragraphs = (items: string[]) => items.map((item, index) => <p key={index}>{item}</p>);

export function EventCard(props: BlockProps) {
  const { block, language } = props;
  return (
    <BiographyBlockShell {...props} className="bio-event-card">
      <div className="prose">{paragraphs(block.items[language])}</div>
    </BiographyBlockShell>
  );
}

export function PersonCardBlock(props: BlockProps) {
  const { block, language, onOpenPerson } = props;
  const people = block.meta?.people ?? [];
  return (
    <BiographyBlockShell {...props} className="bio-person-block">
      <div className="prose compact">{paragraphs(block.items[language])}</div>
      <div className="bio-person-grid">
        {people.map((person) => (
          <PersonCard person={person} language={language} key={person.key} onOpen={onOpenPerson} />
        ))}
      </div>
    </BiographyBlockShell>
  );
}

export function RelationshipCard(props: BlockProps) {
  const { block, language, onOpenPerson } = props;
  const people = block.meta?.people ?? [];
  return (
    <BiographyBlockShell {...props} className="bio-relationship-card">
      <div className="prose">{paragraphs(block.items[language])}</div>
      <div className="bio-person-grid">
        {people.map((person) => (
          <PersonCard person={person} language={language} key={person.key} onOpen={onOpenPerson} />
        ))}
      </div>
    </BiographyBlockShell>
  );
}

function FamilyNodeView({ node, language, depth = 0 }: { node: FamilyNode; language: Language; depth?: number }) {
  if (node.children.length === 0) {
    return (
      <div className="bio-family-node bio-family-leaf">
        <strong>{node.name[language]}</strong>
        <small>{node.role[language]}</small>
      </div>
    );
  }
  return (
    <details className="bio-family-node bio-family-branch" open={depth < 1}>
      <summary>
        <strong>{node.name[language]}</strong>
        <small>{node.role[language]}</small>
        <ChevronDownIcon />
      </summary>
      <div className="bio-family-children">
        {node.children.map((child) => (
          <FamilyNodeView node={child} language={language} depth={depth + 1} key={child.key} />
        ))}
      </div>
    </details>
  );
}

export function FamilyTree(props: BlockProps) {
  const { block, language } = props;
  return (
    <BiographyBlockShell {...props} className="bio-family-tree-block">
      <div className="prose compact">{paragraphs(block.items[language])}</div>
      {block.meta?.familyTree && <div className="bio-family-tree"><FamilyNodeView node={block.meta.familyTree} language={language} /></div>}
    </BiographyBlockShell>
  );
}

export function QuotationCard(props: BlockProps) {
  const { block, language } = props;
  const items = block.items[language];
  return (
    <BiographyBlockShell {...props} className="bio-quotation-card">
      <blockquote className="bio-quotation">{items[0]}</blockquote>
      <div className="prose compact">{paragraphs(items.slice(1))}</div>
    </BiographyBlockShell>
  );
}

export function QuranConnectionBlock(props: BlockProps) {
  const { block, language } = props;
  const items = block.items[language];
  return (
    <BiographyBlockShell {...props} className="bio-quran-connection">
      <blockquote className="quran-quote">{items[0]}</blockquote>
      <div className="prose">{paragraphs(items.slice(1))}</div>
    </BiographyBlockShell>
  );
}

export function HadithEvidenceBlock(props: BlockProps) {
  const { block, language } = props;
  const items = block.items[language];
  return (
    <BiographyBlockShell {...props} className="hadith-feature bio-hadith-evidence">
      <p className="hadith-lead">{items[0]}</p>
      <blockquote>{items[1]}</blockquote>
      <div className="prose">{paragraphs(items.slice(2))}</div>
    </BiographyBlockShell>
  );
}

export function PlaceCard(props: BlockProps) {
  const { block, language } = props;
  const places = block.meta?.places ?? [];
  return (
    <BiographyBlockShell {...props} className="bio-place-block">
      <div className="prose compact">{paragraphs(block.items[language])}</div>
      <div className="bio-place-grid">
        {places.map((place) => (
          <article className="bio-place-card" key={place.key}>
            <h3>{place.name[language]}</h3>
            <p>{place.description[language]}</p>
          </article>
        ))}
      </div>
    </BiographyBlockShell>
  );
}

export function MapBlock(props: BlockProps) {
  const { block, language, onOpenMap } = props;
  const pins = block.meta?.mapPins ?? [];
  return (
    <BiographyBlockShell {...props} className="bio-map-block">
      <div className="prose compact">{paragraphs(block.items[language])}</div>
      <div className="bio-map-frame" data-testid="map-frame">
        {pins.map((pin) => (
          <span className="bio-map-pin" key={pin.key} style={{ insetInlineStart: `${pin.x}%`, top: `${pin.y}%` }} title={pin.label[language]}>
            <span className="bio-map-pin-dot" aria-hidden="true" />
          </span>
        ))}
        <button type="button" className="secondary-button bio-map-expand" onClick={() => onOpenMap?.(block)}>
          <MapIcon />
          {language === "ar" ? "عرض الخريطة بملء الشاشة" : "View map full-screen"}
        </button>
      </div>
    </BiographyBlockShell>
  );
}

export function ChronologyClarificationNote(props: BlockProps) {
  const { block, language } = props;
  const items = block.items[language];
  return (
    <BiographyBlockShell {...props} className="bio-chronology-note">
      <details className="clarification">
        <summary>
          <span>{items[0]}</span>
          <ChevronDownIcon />
        </summary>
        <div className="prose">{paragraphs(items.slice(1))}</div>
      </details>
    </BiographyBlockShell>
  );
}

export function EstablishedVsReportedNote(props: BlockProps) {
  const { block, language } = props;
  const items = block.items[language];
  const labels = language === "ar" ? { established: "الثابت", reported: "المنقول" } : { established: "Established", reported: "Reported" };
  return (
    <BiographyBlockShell {...props} className="bio-established-vs-reported">
      <div className="bio-evr-grid">
        <article data-tone="established"><span>{labels.established}</span><p>{items[0]}</p></article>
        <article data-tone="reported"><span>{labels.reported}</span><p>{items[1]}</p></article>
      </div>
    </BiographyBlockShell>
  );
}

export function CharacterThemeBlock(props: BlockProps) {
  const { block, language } = props;
  return (
    <BiographyBlockShell {...props} className="bio-character-theme">
      <div className="prose">{paragraphs(block.items[language])}</div>
    </BiographyBlockShell>
  );
}

export function LeadershipDecisionCard(props: BlockProps) {
  const { block, language } = props;
  return (
    <BiographyBlockShell {...props} className="bio-leadership-decision">
      <div className="prose">{paragraphs(block.items[language])}</div>
    </BiographyBlockShell>
  );
}

export function TimelineReviewBlock(props: BlockProps) {
  const { block, language } = props;
  return (
    <BiographyBlockShell {...props} className="bio-timeline-review">
      <ul className="bio-timeline-review-list">
        {block.items[language].map((item, index) => (
          <li key={index}>{item.replace(/^[١٢٣٤٥1-5][.،]\s*/, "")}</li>
        ))}
      </ul>
    </BiographyBlockShell>
  );
}

export function BiographyBlockRenderer(props: BlockProps) {
  if (genericTypes.includes(props.block.type)) return <LessonBlockRenderer block={props.block} language={props.language} expandedDeepIds={props.expandedDeepIds} onToggleDeep={props.onToggleDeep} />;
  switch (props.block.type) {
    case "event_card":
      return <EventCard {...props} />;
    case "person_card":
      return <PersonCardBlock {...props} />;
    case "relationship_card":
      return <RelationshipCard {...props} />;
    case "family_tree":
      return <FamilyTree {...props} />;
    case "quotation_card":
      return <QuotationCard {...props} />;
    case "quran_connection":
      return <QuranConnectionBlock {...props} />;
    case "hadith_evidence":
      return <HadithEvidenceBlock {...props} />;
    case "place_card":
      return <PlaceCard {...props} />;
    case "map_block":
      return <MapBlock {...props} />;
    case "chronology_clarification":
      return <ChronologyClarificationNote {...props} />;
    case "established_vs_reported":
      return <EstablishedVsReportedNote {...props} />;
    case "character_theme":
      return <CharacterThemeBlock {...props} />;
    case "leadership_decision":
      return <LeadershipDecisionCard {...props} />;
    case "timeline_review":
      return <TimelineReviewBlock {...props} />;
    default:
      return null;
  }
}
