# Manārāt private web prototype

This is the private Batch 7B learner prototype for Surah al-Fatihah, Lesson 1. It renders the evidence-traceable Draft 3 structured content locally as a guided ten-card lesson. It has no database, authentication, analytics, CMS, external AI API, publishing workflow, or deployment configuration.

## Requirements

- Node.js 20.9 or newer
- npm
- A Chromium-based browser for the Playwright checks

## Start locally

From any terminal:

```bash
cd "/Users/mohamedehabelmolla/Desktop/Islamic books/library_project/apps/web"
npm ci
npm run dev
```

Open [http://localhost:3100](http://localhost:3100). Arabic is the initial language. Port 3100 is the project default so it does not conflict with another local application using port 3000.

For a local production-mode check:

```bash
npm run build
npm run start
```

## Quality commands

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

`npm run test:e2e` starts the application on port 3100, checks guided navigation, strict quiz passing, Lesson 1 completion, responsive behaviour, and accessibility at browser level. `npm run screenshots` refreshes the Batch 7B visual review set.

## Content source

The server-side adapter reads these local Draft 3 files without changing Draft 2:

- `lesson_blocks.json`
- `quiz_questions.json`
- `source_drawer.json`
- `glossary.json`

The adapter exposes a deliberately small public model. It removes claim IDs and never passes local paths, hashes, OCR text, reviewer fields, source-passage IDs, or inspection records to learner components. Draft 3 adds layered core/deep content, audited source summaries, and a ten-question assessment.

The active status is `internal_unapproved`. This prototype is private and has `noindex, nofollow` metadata. There is no deployment configuration.

## Local storage

- Preferred language, current card, visited cards, expanded deep sections, quiz outcome, and Lesson 1 completion use `localStorage`.
- Quiz answers use `sessionStorage`, so they persist through reloads in the current browser session.
- Focus Mode uses `sessionStorage`.
- The footer contains a reset action for local prototype state.

See the project documentation in `library_project/docs/` for architecture, content rendering, localisation, and progress details.
