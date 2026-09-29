import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, deflateSync } from "node:zlib";

import { test as base, expect } from "@playwright/test";
import type { Page, Request } from "@playwright/test";

/**
 * Fake Origin the Test Pages Live On (every request is answered from disk, no server runs).
 */
export const ORIGIN = "http://konfeti.test";

/**
 * URL of the Test Image (a small PNG generated in memory).
 */
export const COIN_URL = `${ORIGIN}/assets/coin.png`;

/**
 * Built Library Folder.
 */
const DIST_DIR = fileURLToPath(new URL("../../packages/konfeti/dist/", import.meta.url));

/**
 * Built Site Folder (`pnpm site:build`), served under its production base path.
 */
const SITE_DIR = fileURLToPath(new URL("../../playground/dist/", import.meta.url));

/**
 * Production Base Path of the Site.
 */
const SITE_BASE = "/tools/konfeti/";

/**
 * Test Page Folder.
 */
const PAGES_DIR = fileURLToPath(new URL("../pages/", import.meta.url));

/**
 * Content Types by File Extension.
 */
const CONTENT_TYPES: Readonly<Record<string, string>> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".cjs": "text/javascript",
  ".map": "application/json",
};

/**
 * Side Length of the Test PNG.
 */
const COIN_SIZE = 16;

/**
 * Build PNG Chunk (length, type, data, CRC).
 *
 * @param type - Four-Letter Chunk Type
 * @param data - Chunk Data
 * @returns Encoded Chunk
 */
function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

/**
 * Encode Solid Gold Square as PNG (keeps binary fixtures out of the repo).
 *
 * @returns PNG Bytes
 */
function createCoinPng(): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(COIN_SIZE, 0);
  header.writeUInt32BE(COIN_SIZE, 4);
  header.set([8, 6, 0, 0, 0], 8); // 8-bit RGBA, no interlace
  // each row: filter byte 0, then RGBA pixels
  const row = Buffer.concat([
    Buffer.from([0]),
    Buffer.from(Array.from({ length: COIN_SIZE }, () => [255, 196, 0, 255]).flat()),
  ]);
  const pixels = Buffer.concat(Array.from({ length: COIN_SIZE }, () => row));

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(pixels)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

/**
 * Route Every Request on the Fake Origin to Disk.
 * `/dist/*` → built library, `/tools/konfeti/*` → built site, `/assets/coin.png` → generated PNG, anything
 * else → `pages/`; unknown files 404.
 *
 * @param page - Page to Route
 */
async function serveFromDisk(page: Page): Promise<void> {
  const coin = createCoinPng();

  await page.route(`${ORIGIN}/**`, async (route) => {
    const { pathname } = new URL(route.request().url());

    if (pathname === "/assets/coin.png") {
      await route.fulfill({ body: coin, contentType: "image/png" });
      return;
    }

    const file = pathname.startsWith("/dist/")
      ? DIST_DIR + pathname.slice("/dist/".length)
      : pathname.startsWith(SITE_BASE)
        ? SITE_DIR + pathname.slice(SITE_BASE.length).replace(/(^|\/)$/, "$1index.html")
        : PAGES_DIR + pathname.slice(1);

    try {
      const body = await readFile(file);
      await route.fulfill({
        body,
        contentType: CONTENT_TYPES[extname(file)] ?? "application/octet-stream",
      });
    } catch {
      await route.fulfill({ status: 404, body: "not found" });
    }
  });
}

/**
 * What a Test Page Reported While It Ran.
 */
export type PageLog = {
  /**
   * Uncaught Errors and `console.error` Messages.
   */
  readonly errors: string[];
  /**
   * Every `console.log` Message Text.
   */
  readonly logs: string[];
  /**
   * Paths of Every Request the Page Made.
   */
  readonly requests: string[];
};

/**
 * Playwright Test with a `site` Fixture: routing installed, errors / logs / requests recorded.
 */
export const test = base.extend<{ site: PageLog }>({
  site: [
    async ({ page }, use) => {
      const log: PageLog = { errors: [], logs: [], requests: [] };
      page.on("pageerror", (error) => log.errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") {
          log.errors.push(message.text());
        } else if (message.type() === "log") {
          log.logs.push(message.text());
        }
      });
      page.on("request", (request: Request) => log.requests.push(new URL(request.url()).pathname));
      await serveFromDisk(page);
      await use(log);
    },
    // every test needs the routes, even one that never reads the log
    { auto: true },
  ],
});

/**
 * Open a Test Page and Wait until Its Scripts Ran.
 *
 * @param page - Page
 * @param name - Page File in `pages/`
 */
export async function openPage(page: Page, name: "esm.html" | "iife.html"): Promise<void> {
  await page.goto(`${ORIGIN}/${name}`);
  await expect(page.locator("body[data-ready='true']")).toBeAttached();
}

export { expect };

/**
 * Open a Page of the Built Site (playground at `""`, guide at `"docs/"`).
 *
 * @param page - Page
 * @param path - Path below the Base Path
 */
export async function openSite(page: Page, path: "" | "docs/"): Promise<void> {
  await page.goto(`${ORIGIN}${SITE_BASE}${path}?lang=en`);
}
