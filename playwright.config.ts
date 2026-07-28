import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // screenshots.spec.ts is a manual visual-review capture tool (run
  // separately via `npm run screenshots`), not a regression test: it writes
  // into ../../reports/screenshots/ -- outside this repository, into the
  // private research repository's folder structure -- which is meaningless
  // and unsafe in a CI checkout. Excluded from the regular suite here so
  // `npm run test:e2e` behaves identically locally and in CI.
  testIgnore: ["**/screenshots.spec.ts"],
  fullyParallel: false,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://127.0.0.1:3100",
    browserName: "chromium",
    channel: "chrome",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
