# Continuous integration

This document explains the automated quality gates for `apps/web` (workflow: `.github/workflows/ci.yml`).

## When CI runs

- On every pull request targeting `main`.
- On every push to `main`.
- On demand, via the "Run workflow" button (`workflow_dispatch`).

A new commit on the same branch/PR cancels the previous, now-superseded run. There is no scheduled/nightly run.

## What CI enforces

In order, all in one job (`quality-gates`), so the app is installed and built only once per run:

1. **Private-file safety scan** (`npm run safety:scan`) — fails fast, before anything else, if private/research material is tracked in this repository.
2. **Lint** (`npm run lint`)
3. **Typecheck** (`npm run typecheck`)
4. **Unit tests** (`npm test`)
5. **Production build** (`npm run build`)
6. **Playwright end-to-end tests, including the existing Axe accessibility checks** (`npm run test:e2e`)

All six must pass for the workflow to succeed. There is no secret required, no Vercel dependency, and no deployment step — CI only checks out the repository and runs the commands above.

`e2e/screenshots.spec.ts` is intentionally excluded from `npm run test:e2e` (via `testIgnore` in `playwright.config.ts`) both locally and in CI: it is a manual visual-review capture tool, not a regression test, and it writes into `../../reports/screenshots/` — outside this repository, into the private research repository's folder structure — which is meaningless (and unsafe) in a CI checkout. Run it on demand with `npm run screenshots` when you actually want a fresh visual-review set.

## Running the same checks locally

```bash
npm ci
npm run safety:scan
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install --with-deps chrome   # first time only
npm run test:e2e
```

## What the private-file safety scanner protects

`scripts/check-private-files.mjs` (invoked via `npm run safety:scan`) inspects the **exact tracked Git snapshot** (`git ls-files`), not just whatever happens to be on disk. It fails (non-zero exit) if any tracked path or tracked text content matches a prohibited pattern. Full rule list and reasoning are in the script's own header comment and inline rule definitions — in summary:

- **Path rules**: original PDFs; `content_research/`, `content_drafts/`, `research_packs/`, `evidence_images/`, `extracted_text/`, `page_samples/`, `source_review_records/`, `organized_library/`, `originals/`, internal `reports/`; local backup folders; reviewer-question, decision-form, decision-application, sentence-traceability, `claims.json`, validation-report, human-review-packet, reconciliation-report, and draft-decisions filenames; `.env`/key/credential files.
- **Content rules**: absolute macOS/Linux (`/Users/...`) or Windows (`C:\Users\...`) paths; `file://` URIs; Mohamed's full local project path; references to the private organised-library path or evidence-image paths; PDF filesystem paths; internal decision-form/reviewer-questions/sentence-traceability filenames appearing in text; and common credential shapes (AWS keys, GitHub tokens, private key headers, bearer tokens, database URLs with embedded credentials, generic API-key/secret assignments).

It deliberately does **not** flag ordinary learner-facing vocabulary — words like "claim," "source," "review," or the current `internal_unapproved` status are expected throughout this app's own content and are never, by themselves, a violation. It also does not ban `.jpg`/`.png`/`.svg` globally: a sanitised `source_drawer.json` or an ordinary `public/` image asset passes; a private evidence-image *path* does not.

An explicit, documented `ALLOWLIST` exists in the script for the rare case where a legitimate tracked file would otherwise match a rule (currently empty — nothing in this app needs one). A separate, narrower `CONTENT_SCAN_EXEMPT_PATHS` list excludes only the scanner's own script, its test file, and one pre-existing inline check (`e2e/sahabah.spec.ts`) from the *content* rules specifically, because all three intentionally contain the forbidden-pattern strings as detection logic or test fixtures, not as real leaked references — their *paths* are still checked like any other file.

## What belongs in `apps/web`

Learner-facing application code and content only: React components, routes, sanitised lesson content (`lesson_blocks.json`, `quiz_questions.json`, `source_drawer.json`, `glossary.json` — with only the fields the content adapter's `RawSource`/`RawBlock`/`RawQuestion` types declare), tests, and this CI tooling.

## What must remain in the private research repository

Everything the safety scanner's path rules name: the raw research corpus, evidence images, extracted text, content drafts (claims, sentence traceability, reviewer questions, Mohamed's decision records), research packs, the organised-library structure, and internal validation/reporting artifacts. See `library_project/docs/REPOSITORY_AND_BACKUP_BOUNDARY.md` for the full explanation of that boundary.

## How to investigate a failed scan

1. Read the failure output — it lists each offending tracked path, which rule matched, and why.
2. If the file genuinely should not be in `apps/web`, remove it from the branch (`git rm`) rather than from `.gitignore` alone — the scanner checks what's tracked, not what's ignored.
3. If the match is a false positive on a file that has a real, legitimate reason to be tracked here, do not delete or narrow a rule to make it pass. Add a documented entry to `ALLOWLIST` (or, only for the narrow self-referential case described above, `CONTENT_SCAN_EXEMPT_PATHS`) in `scripts/check-private-files.mjs`, with a one-line reason, and get it reviewed.

**Bypassing or weakening this scan (removing a rule, widening `ALLOWLIST` without a documented reason, or skipping the CI step) requires explicit review before merging.** It is the one gate in this pipeline whose entire purpose is to catch a mistake that would otherwise be easy to miss.
