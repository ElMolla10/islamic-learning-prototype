"use client";

import type { Language, Person } from "@/content/types";

export function PersonCard({ person, language, onOpen }: { person: Person; language: Language; onOpen?: (person: Person) => void }) {
  return (
    <button type="button" className="bio-person-card" onClick={() => onOpen?.(person)}>
      <span className="bio-person-avatar" aria-hidden="true">
        {person.name[language].charAt(0)}
      </span>
      <span className="bio-person-copy">
        <strong>{person.name[language]}</strong>
        {person.kunyah && <small>{person.kunyah[language]}</small>}
        <span className="bio-person-relation">{person.relation[language]}</span>
      </span>
    </button>
  );
}

export function PersonDetail({ person, language }: { person: Person; language: Language }) {
  return (
    <div className="bio-person-detail">
      <span className="bio-person-avatar" aria-hidden="true">
        {person.name[language].charAt(0)}
      </span>
      <h3>{person.name[language]}</h3>
      {person.kunyah && <p className="bio-person-kunyah">{person.kunyah[language]}</p>}
      <p className="bio-person-relation-full">{person.relation[language]}</p>
      <p>{person.note[language]}</p>
    </div>
  );
}
