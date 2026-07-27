# Abu Bakr path — content folder mapping

This folder holds the website's Abu Bakr lesson content (`lesson_01` ... `lesson_11`, one per website
route `/sahabah/abu-bakr/lesson-1` ... `/sahabah/abu-bakr/lesson-11`). All content in every folder here is
**placeholder structure only** — see the `status: "placeholder_structure_only"` field and `note` in every
JSON file. No real Abu Bakr content has been written into any of these folders.

The evidence base for eventual real content lives separately, in
`content_research/abu_bakr/` (outside this web app, at the project root) — one evidence folder per
research batch (8A.1–8A.12). **The website's 11 lessons do not map 1:1 onto those 12 evidence folders**,
because website lesson 6 merges two evidence folders (the Prophet's ﷺ final illness and the day he died)
into a single chapter. Every website lesson number from 7 onward is therefore offset by one relative to
its evidence folder. This table is the source of truth for that mapping:

| Website lesson (this folder / route) | content_research evidence folder |
| --- | --- |
| `lesson_01` → `/sahabah/abu-bakr/lesson-1` | `content_research/abu_bakr/lesson_01_who_was_abu_bakr/` |
| `lesson_02` → `/sahabah/abu-bakr/lesson-2` | `content_research/abu_bakr/lesson_02_first_days_of_islam/` |
| `lesson_03` → `/sahabah/abu-bakr/lesson-3` | `content_research/abu_bakr/lesson_03_faith_under_persecution/` |
| `lesson_04` → `/sahabah/abu-bakr/lesson-4` | `content_research/abu_bakr/lesson_04_companion_of_the_cave/` |
| `lesson_05` → `/sahabah/abu-bakr/lesson-5` | `content_research/abu_bakr/lesson_05_abu_bakr_in_madinah/` (+ its `uhud_source_passages.json` sub-file) |
| `lesson_06_final_illness_and_death` → `/sahabah/abu-bakr/lesson-6` | `content_research/abu_bakr/lesson_06_final_illness/` **+** `content_research/abu_bakr/lesson_07_the_day_the_prophet_died/` (merged) |
| `lesson_07` → `/sahabah/abu-bakr/lesson-7` | `content_research/abu_bakr/lesson_08_the_first_caliph/` |
| `lesson_08` → `/sahabah/abu-bakr/lesson-8` | `content_research/abu_bakr/lesson_09_ridda_crisis/` |
| `lesson_09` → `/sahabah/abu-bakr/lesson-9` | `content_research/abu_bakr/lesson_10_preserving_the_quran/` |
| `lesson_10` → `/sahabah/abu-bakr/lesson-10` | `content_research/abu_bakr/lesson_11_final_days_and_legacy/` |
| `lesson_11` → `/sahabah/abu-bakr/lesson-11` | `content_research/abu_bakr/lesson_12_timeline_review/` |

**The offset starts at website lesson 7** (evidence `lesson_08`) and holds constant (+1) through website
lesson 11 (evidence `lesson_12`), because exactly one merge (website lesson 6 absorbing two evidence
folders) happened before that point and no other merges occur.

## How lesson numbers become folder names

`src/content/abu_bakr/server.ts` holds the only place this mapping is encoded in code (`CONTENT_FOLDERS`).
Every website lesson number maps to a plain `lesson_NN` folder **except lesson 6**, which uses the
descriptive name `lesson_06_final_illness_and_death` instead of a bare `lesson_06` — a deliberate reminder,
every time someone opens this directory, that this specific folder represents two merged evidence sources
rather than one. If you rename or renumber lessons in `src/content/catalogue.ts`'s `abuBakrPath`, update
`CONTENT_FOLDERS` in `server.ts` and this table together — they must stay in sync.

## File shape (all 11 folders, identical)

Each lesson folder contains exactly 4 files, matching the shape `adaptBiographyLesson` (in `adapter.ts`)
expects:

- `lesson_blocks.json` — `timeline_phases` + `blocks` (see `content/types.ts`'s `LessonBlockType` for the
  full set of supported block types)
- `quiz_questions.json` — `questions`, each with a `review_card_id` pointing back to a real `block_id`
- `source_drawer.json` — `sources`
- `glossary.json` — `terms`

## Adding real content

When Mohamed approves real content for a given lesson, replace that lesson's 4 files in place (same
filenames, same folder) with real data in the same shape. No code changes are needed — `server.ts` reads
whichever files exist in the mapped folder for a given lesson number, and the route
(`src/app/sahabah/abu-bakr/lesson-[n]/page.tsx`) is fully generic across all 11 lesson numbers.
