# Manārāt private web prototype

This is the private Batch 7A learner prototype for Surah al-Fatihah, Lesson 1. It renders the validated Draft 2 structured content locally. It has no database, authentication, analytics, CMS, external AI API, publishing workflow, or deployment configuration.

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

`npm run test:e2e` starts the application on port 3100, checks the required routes and interactions at browser level, audits accessibility, tests all required widths, and refreshes the Batch 7A screenshots.

## Content source

The server-side adapter reads these local Draft 2 files without changing them:

- `lesson_blocks.json`
- `quiz_questions.json`
- `source_drawer.json`
- `glossary.json`

The adapter exposes a deliberately small public model. It removes claim IDs and never passes local paths, hashes, OCR text, reviewer fields, source-passage IDs, or inspection records to learner components.

The active status is `internal_unapproved`. This prototype is private and has `noindex, nofollow` metadata. There is no deployment configuration.

## Local storage

- Preferred language and lesson progress use `localStorage`.
- Quiz answers use `sessionStorage`, so they persist through reloads in the current browser session.
- The footer contains a reset action for local prototype state.

See the project documentation in `library_project/docs/` for architecture, content rendering, localisation, and progress details.
