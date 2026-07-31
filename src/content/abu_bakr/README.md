# Abu Bakr path — public identity and content folders

`lesson_identity.json` is the deterministic, allowlisted public projection of the private curriculum
mapping. `identity.ts` validates it and exposes explicit lookups by canonical slug and stable public route
alias. It contains no research positions, package IDs, private paths, or internal curriculum status.

The canonical slug is the lesson identity. The existing `lesson-1` through `lesson-11` route slugs,
number-bearing progress keys, quiz keys, and completed-lesson IDs are retained as explicit compatibility
aliases. They must not be reconstructed from an array index, display number, content-folder suffix, or
arithmetic offset.

Each mapped content folder contains the same four learner-facing JSON files:

- `lesson_blocks.json`
- `quiz_questions.json`
- `source_drawer.json`
- `glossary.json`

Every file's `lesson_id` must equal the mapping entry's canonical slug. The server refuses missing,
unknown, or mismatched identities before adapting content. Lessons 1 and 2 contain integrated content;
later folders remain structural placeholders until their separately reviewed packages are exported.

To add a later lesson, update the authoritative private mapping, regenerate `lesson_identity.json` through
the allowlisted exporter, and export the reviewed lesson package. Do not renumber routes or storage aliases,
and do not add a positional fallback.
