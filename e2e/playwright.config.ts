import { defineConfig } from "@playwright/test";

/**
 * Playwright configuration for konfeti's browser tests.
 *
 * Pages are served straight from disk through request interception (see `support/site.ts`), so no web server
 * runs. The tests load the built `packages/konfeti/dist`, so `pnpm build` must run first (`pnpm e2e` does).
 * The installed Chrome is used (`channel: "chrome"`), so no separate browser download is needed.
 */
export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  retries: process.env["CI"] === undefined ? 0 : 1,
  reporter: process.env["CI"] === undefined ? "list" : [["list"], ["github"]],
  use: {
    channel: "chrome",
    headless: true,
    viewport: { width: 800, height: 600 },
  },
});
