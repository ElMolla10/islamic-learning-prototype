// Type declarations for check-private-files.mjs, so `tsc --noEmit` (which
// runs with allowJs: false) can resolve the import from
// src/lib/private-file-scanner.test.ts without type errors, while the
// actual runtime module stays a plain, dependency-free ESM script.

export type ScannerViolation = { id: string; reason: string };
export type PathRule = { id: string; pattern: RegExp; reason: string; basenameOnly?: boolean };

export const PROHIBITED_PATH_RULES: PathRule[];
export const PROHIBITED_CONTENT_RULES: PathRule[];
export const CONTENT_SCAN_EXEMPT_PATHS: Set<string>;
export const ALLOWLIST: { path: string; reason: string }[];

export function classifyPath(relPath: string): ScannerViolation[];
export function scanTextContent(relPath: string, content: string): ScannerViolation[];
export function isTextLikePath(relPath: string): boolean;
