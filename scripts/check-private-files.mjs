#!/usr/bin/env node
// Private-file safety scanner for apps/web.
//
// Inspects the EXACT tracked snapshot (`git ls-files`), not the working-tree
// filesystem, so it catches what would actually be pushed/committed rather
// than what happens to exist locally. Fails (non-zero exit) if any tracked
// path or tracked text content matches a rule below.
//
// Design notes (read before editing a rule):
// - Path rules match the git-relative path or its basename.
// - Content rules only run against text-like tracked files and are scoped
//   deliberately narrowly: they look for path-shaped or credential-shaped
//   strings, never bare words like "claim", "source", "review", or
//   "internal_unapproved", which are legitimate and common in this app's
//   own learner-facing and status vocabulary.
// - CONTENT_SCAN_EXEMPT_PATHS exists ONLY because this script and its test
//   file must contain the detection patterns themselves (as regex source
//   and as synthetic fixture strings) to do their job and to be testable.
//   It does not exempt those files from the PATH rules above -- only from
//   the CONTENT rules -- and it must never be used for anything else.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TEXT_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".json", ".md", ".mdx", ".txt", ".yml", ".yaml",
  ".css", ".html", ".svg",
]);

/** @type {{ pattern: RegExp; id: string; reason: string }[]} */
export const PROHIBITED_PATH_RULES = [
  { id: "path:content_research", pattern: /(^|\/)content_research\//i, reason: "private research corpus directory" },
  { id: "path:content_drafts", pattern: /(^|\/)content_drafts\//i, reason: "private lesson-draft directory" },
  { id: "path:research_packs", pattern: /(^|\/)research_packs\//i, reason: "private research-pack directory" },
  { id: "path:evidence_images", pattern: /(^|\/)evidence_images\//i, reason: "private manuscript evidence images" },
  { id: "path:extracted_text", pattern: /(^|\/)extracted_text(\/|$)/i, reason: "private OCR/extraction directory" },
  { id: "path:page_samples", pattern: /(^|\/)page_samples(\/|$)/i, reason: "private page-render sample directory" },
  { id: "path:source_review_records", pattern: /(^|\/)source_review_records\//i, reason: "internal reviewer-decision records" },
  { id: "path:organized_library", pattern: /(^|\/)organized_library\//i, reason: "private organised-library structure" },
  { id: "path:originals", pattern: /(^|\/)originals\//i, reason: "original-source directory" },
  { id: "path:internal_reports", pattern: /(^|\/)reports\//i, reason: "internal batch/validation reports directory" },
  { id: "path:backup_folder", pattern: /(^|\/)(backup|backups)(\/|$)/i, reason: "local backup folder" },
  { id: "path:pdf_file", pattern: /\.pdf$/i, reason: "original PDF file", basenameOnly: true },
  { id: "path:reviewer_questions", pattern: /reviewer_questions/i, reason: "reviewer-question record", basenameOnly: true },
  { id: "path:decision_form", pattern: /decision_form/i, reason: "Mohamed's decision-form record", basenameOnly: true },
  { id: "path:decision_application_report", pattern: /decision_application_report/i, reason: "applied-decision record", basenameOnly: true },
  { id: "path:sentence_traceability", pattern: /sentence_traceability/i, reason: "sentence-traceability record", basenameOnly: true },
  { id: "path:claims_json", pattern: /claims\.json$/i, reason: "internal claims file", basenameOnly: true },
  { id: "path:validation_report", pattern: /validation_report/i, reason: "internal validation package", basenameOnly: true },
  { id: "path:human_review_packet", pattern: /human_review_packet/i, reason: "internal human-review packet", basenameOnly: true },
  { id: "path:reconciliation_report", pattern: /reconciliation_report/i, reason: "internal ID-reconciliation report", basenameOnly: true },
  { id: "path:draft_decisions", pattern: /draft_decisions/i, reason: "internal editorial-decisions record", basenameOnly: true },
  { id: "path:evidence_sufficiency_report", pattern: /evidence_sufficiency_report/i, reason: "internal evidence-sufficiency record", basenameOnly: true },
  { id: "path:dotenv", pattern: /^\.env(\..+)?$/i, reason: "environment/credential file", basenameOnly: true },
  { id: "path:private_key", pattern: /\.(pem|key)$/i, reason: "private key file", basenameOnly: true },
  { id: "path:ssh_key", pattern: /^id_rsa/i, reason: "SSH private key file", basenameOnly: true },
];

/** @type {{ pattern: RegExp; id: string; reason: string }[]} */
export const PROHIBITED_CONTENT_RULES = [
  { id: "content:mac_user_path", pattern: /\/Users\/[A-Za-z0-9_.\-]+/, reason: "absolute macOS/Linux user path" },
  { id: "content:windows_user_path", pattern: /[A-Za-z]:\\+Users\\+[^\s"'\\]+/i, reason: "absolute Windows user path" },
  { id: "content:file_uri", pattern: /file:\/\//i, reason: "file:// URI" },
  { id: "content:project_root_path", pattern: /Islamic books\/library_project/i, reason: "Mohamed's full local project path" },
  { id: "content:organized_library_path", pattern: /organized_library\//i, reason: "reference to the private organised-library path" },
  { id: "content:evidence_images_path", pattern: /evidence_images\//i, reason: "reference to a private evidence-image path" },
  { id: "content:pdf_filesystem_path", pattern: /(^|[\s"'(])(\.\.?\/|\/)[^\s"']*\.pdf\b/i, reason: "original PDF filesystem path" },
  { id: "content:decision_form_filename", pattern: /(mohamed_)?decision_form\.(json|md)/i, reason: "reference to an internal decision-form filename" },
  { id: "content:reviewer_questions_filename", pattern: /reviewer_questions\.md/i, reason: "reference to an internal reviewer-questions filename" },
  { id: "content:sentence_traceability_filename", pattern: /sentence_traceability\.(json|md)/i, reason: "reference to an internal sentence-traceability filename" },
  { id: "content:aws_key", pattern: /AKIA[0-9A-Z]{16}/, reason: "AWS access key" },
  { id: "content:github_token", pattern: /gh[pousr]_[A-Za-z0-9]{20,}/, reason: "GitHub token" },
  { id: "content:private_key_header", pattern: /-----BEGIN (RSA |EC |OPENSSH |DSA |)PRIVATE KEY-----/, reason: "private key header" },
  { id: "content:bearer_token", pattern: /[Bb]earer\s+[A-Za-z0-9\-_.]{20,}/, reason: "bearer token" },
  { id: "content:db_url_with_creds", pattern: /(postgres|postgresql|mysql|mongodb(\+srv)?):\/\/[^:\s]+:[^@\s]+@/, reason: "database URL with embedded credentials" },
  { id: "content:generic_secret_assignment", pattern: /(?:api[_-]?key|apikey|secret[_-]?key|client[_-]?secret|access[_-]?token)\s*[:=]\s*["']?[A-Za-z0-9\-_.]{16,}/i, reason: "generic API key/secret assignment" },
];

// Files that legitimately contain the rule patterns themselves (as regex
// source or as synthetic, redacted test fixtures) and are therefore exempt
// from the CONTENT rules only. Their paths still go through the PATH rules
// like every other file, and they must contain no real private data.
export const CONTENT_SCAN_EXEMPT_PATHS = new Set([
  "scripts/check-private-files.mjs",
  "src/lib/private-file-scanner.test.ts",
  // Pre-existing inline check (predates this scanner) that contains the
  // same kind of forbidden-pattern literals (e.g. "evidence_images/") as
  // its own detection logic, not as a real leaked reference. See
  // e2e/sahabah.spec.ts's "git ls-files shows no private research
  // material bundled into the app" test.
  "e2e/sahabah.spec.ts",
]);

// Explicit, documented exceptions for specific tracked paths that would
// otherwise match a rule above. Empty today -- no currently-tracked file in
// apps/web needs one. Add an entry only with a written reason, and prefer
// fixing the actual file over widening this list.
/** @type {{ path: string; reason: string }[]} */
export const ALLOWLIST = [];

/**
 * @param {string} relPath git-relative path, forward-slash separated
 * @returns {{ id: string; reason: string }[]} violations (empty if clean)
 */
export function classifyPath(relPath) {
  if (ALLOWLIST.some((entry) => entry.path === relPath)) return [];
  const basename = relPath.split("/").pop() ?? relPath;
  const violations = [];
  for (const rule of PROHIBITED_PATH_RULES) {
    const target = rule.basenameOnly ? basename : relPath;
    if (rule.pattern.test(target)) {
      violations.push({ id: rule.id, reason: rule.reason });
    }
  }
  return violations;
}

/**
 * @param {string} relPath
 * @param {string} content
 * @returns {{ id: string; reason: string }[]}
 */
export function scanTextContent(relPath, content) {
  if (ALLOWLIST.some((entry) => entry.path === relPath)) return [];
  if (CONTENT_SCAN_EXEMPT_PATHS.has(relPath)) return [];
  const violations = [];
  for (const rule of PROHIBITED_CONTENT_RULES) {
    if (rule.pattern.test(content)) {
      violations.push({ id: rule.id, reason: rule.reason });
    }
  }
  return violations;
}

export function isTextLikePath(relPath) {
  const ext = path.extname(relPath).toLowerCase();
  return TEXT_EXTENSIONS.has(ext);
}

function main() {
  const repoRoot = process.cwd();
  const tracked = execFileSync("git", ["ls-files"], { cwd: repoRoot, encoding: "utf8" })
    .split("\n")
    .filter(Boolean);

  /** @type {{ path: string; id: string; reason: string; kind: "path" | "content" }[]} */
  const findings = [];

  for (const relPath of tracked) {
    for (const violation of classifyPath(relPath)) {
      findings.push({ path: relPath, kind: "path", ...violation });
    }
    if (isTextLikePath(relPath)) {
      let content;
      try {
        content = readFileSync(path.join(repoRoot, relPath), "utf8");
      } catch {
        continue; // e.g. a tracked symlink with no regular-file target here
      }
      for (const violation of scanTextContent(relPath, content)) {
        findings.push({ path: relPath, kind: "content", ...violation });
      }
    }
  }

  if (findings.length === 0) {
    console.log(`safety:scan — OK (${tracked.length} tracked files checked, 0 violations)`);
    return 0;
  }

  console.error(`safety:scan — FAILED (${findings.length} violation(s) found)\n`);
  for (const f of findings) {
    console.error(`  [${f.kind}] ${f.path}\n    rule: ${f.id} — ${f.reason}`);
  }
  console.error(
    "\nA prohibited private/research reference is tracked in apps/web. " +
      "See docs/CI.md ('How to investigate a failed scan') before removing or " +
      "widening any rule -- bypassing this check requires explicit review.",
  );
  return 1;
}

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) {
  process.exit(main());
}
