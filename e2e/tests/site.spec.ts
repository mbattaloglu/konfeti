import type { Page } from "@playwright/test";

import { ANALYTICS_SCRIPT, expect, openSite, ORIGIN, test } from "../support/site";

test.describe("built site (playground)", () => {
  test("every preset fires without an error toast", async ({ page, site }) => {
    await openSite(page, "");
    const presets = page.locator("button.preset");
    await expect(presets.first()).toBeVisible();
    const toast = page.locator("#toast");
    const failures: string[] = [];

    for (const preset of await presets.all()) {
      await preset.click();
      // the toast only shows up for errors here (presets have no success message)
      if (await toast.evaluate((element) => element.classList.contains("is-error"))) {
        failures.push(`${await preset.innerText()}: ${await toast.innerText()}`);
        await toast.evaluate((element) => {
          element.classList.remove("is-error", "is-visible");
        });
      }
    }

    expect(failures).toEqual([]);
    expect(site.errors).toEqual([]);
  });
});

test.describe("built site (analytics)", () => {
  test("the playground, the guide and the API reference load Vercel Web Analytics", async ({
    page,
    site,
  }) => {
    const pages = [
      `${ORIGIN}/tools/konfeti/?lang=en`,
      `${ORIGIN}/tools/konfeti/docs/?lang=en`,
      `${ORIGIN}/tools/konfeti/docs/api/`,
    ];

    for (const url of pages) {
      site.requests.length = 0;
      await page.goto(url);
      await expect.poll(() => site.requests).toContain(ANALYTICS_SCRIPT);
    }

    expect(site.errors).toEqual([]);
  });
});

test.describe("built site (docs)", () => {
  test("the language switch changes the guide to Turkish and back", async ({ page, site }) => {
    await openSite(page, "docs/");
    await expect(page.locator("#docs-content h2").first()).toContainText("API at a glance");

    await page.locator(".lang-switch button", { hasText: "TR" }).click();
    await expect(page.locator("#docs-content h2").first()).toContainText("Bir bakışta API");
    await expect(page.locator("html")).toHaveAttribute("lang", "tr");

    await page.locator(".lang-switch button", { hasText: "EN" }).click();
    await expect(page.locator("#docs-content h2").first()).toContainText("API at a glance");
    expect(site.errors).toEqual([]);
  });
});

test.describe("built site (language switch after following a section link)", () => {
  test("switches even when the URL has a #section", async ({ page }) => {
    // no ?lang= in the URL: the pick is stored, so only the #hash differs after switching
    await page.goto("http://konfeti.test/tools/konfeti/docs/#shapes");
    await page.locator(".lang-switch button", { hasText: "EN" }).click();
    await expect(page.locator("#docs-content h2").first()).toContainText("API at a glance");

    await page.locator("#docs-toc a").nth(2).click();
    await expect(page).toHaveURL(/#/);
    await page.locator(".lang-switch button", { hasText: "TR" }).click();

    await expect(page.locator("#docs-content h2").first()).toContainText("Bir bakışta API");
    await expect(page).not.toHaveURL(/#/);
  });
});

/**
 * Record Clipboard Writes (the fake http origin is not a secure context, so the real clipboard is unavailable).
 */
const RECORD_CLIPBOARD = (): void => {
  const copied: string[] = [];
  Object.assign(window, { copied });
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: (text: string) => {
        copied.push(text);
        return Promise.resolve();
      },
    },
  });
};

/**
 * Return the Last Recorded Clipboard Text.
 *
 * @param page - Page
 * @returns Copied Text
 */
async function lastCopied(page: Page): Promise<string> {
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { copied: string[] }).copied.length))
    .toBeGreaterThan(0);
  return page.evaluate(() => (window as unknown as { copied: string[] }).copied.at(-1) ?? "");
}

test.describe("built site (share link and code export)", () => {
  test("a share link restores the settings it was made with", async ({ page }) => {
    await page.addInitScript(RECORD_CLIPBOARD);
    await page.goto("http://konfeti.test/tools/konfeti/?lang=en");
    await page.locator('[data-key="particleCount"] input[type="range"]').fill("123");

    await page.locator("#tab-btn-export").click();
    await page.locator("#share").click();
    const link = await lastCopied(page);
    expect(link).toMatch(/[?&]s=/);
    expect(link).not.toMatch(/lang=/);

    expect(await page.locator("#share-link").inputValue()).toBe(link);

    await page.goto(link);
    await expect(page.locator('[data-key="particleCount"] input[type="range"]')).toHaveValue("123");
  });

  test("Copy Code produces a snippet that fires the current settings", async ({ page }) => {
    await page.addInitScript(RECORD_CLIPBOARD);
    await page.goto("http://konfeti.test/tools/konfeti/?lang=en");
    await page.locator('[data-key="particleCount"] input[type="range"]').fill("77");

    await page.locator("#tab-btn-export").click();
    // the tab previews the same snippet the button copies
    await expect(page.locator("#code-preview")).toContainText("particleCount: 77");
    await page.locator("#copy-code").click();
    const code = await lastCopied(page);
    expect(code).toContain('import { Konfeti } from "konfeti";');

    // run the snippet against a stub Konfeti: it must be valid code and carry the current settings
    await page.evaluate(() => {
      Object.assign(window, {
        stub: {
          fire: (options: unknown) => {
            Object.assign(window, { fired: options });
          },
        },
      });
    });
    await page.addScriptTag({
      content: code.replace(/^import .*$/m, "const Konfeti = window.stub;"),
    });
    const fired = await page.evaluate(
      () => (window as unknown as { fired?: { particleCount?: number } }).fired,
    );

    expect(fired?.particleCount).toBe(77);
  });

  test("the All Settings mode writes every setting out and still runs", async ({ page }) => {
    await page.addInitScript(RECORD_CLIPBOARD);
    await page.goto("http://konfeti.test/tools/konfeti/?lang=en");
    await page.locator("#tab-btn-export").click();
    await page.locator('.code-mode-option[data-mode="all"]').click();
    await page.locator("#copy-code").click();
    const code = await lastCopied(page);

    await page.evaluate(() => {
      Object.assign(window, {
        stub: {
          fire: (options: unknown) => {
            Object.assign(window, { fired: options });
          },
        },
      });
    });
    await page.addScriptTag({
      content: code.replace(/^import .*$/m, "const Konfeti = window.stub;"),
    });
    const fired = await page.evaluate(
      () =>
        (
          window as unknown as {
            fired?: { particleCount?: number; paper?: { colors?: unknown[] } };
          }
        ).fired,
    );

    // defaults are written out too: the paper palette is there even though nothing was changed
    expect(fired?.particleCount).toBe(60);
    expect(fired?.paper?.colors?.length).toBeGreaterThan(0);
  });
});

/**
 * Fetch a File of the Built Site from Inside the Page (requests go through the disk routes).
 *
 * @param page - Page Open on the Site
 * @param path - Path below the Base Path
 * @returns Status and Text
 */
async function fetchSiteFile(page: Page, path: string): Promise<{ status: number; text: string }> {
  return page.evaluate(async (url) => {
    const response = await fetch(url);
    return { status: response.status, text: await response.text() };
  }, `${ORIGIN}/tools/konfeti/${path}`);
}

/**
 * Count Guide Sections Removed from the Page (an English guide the build wrote must be kept, not re-rendered).
 */
const RECORD_REMOVED_SECTIONS = (): void => {
  const removed = { count: 0 };
  Object.assign(window, { removed });
  new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.removedNodes) {
        if (node instanceof Element && node.classList.contains("docs-section")) {
          removed.count += 1;
        }
      }
    }
  }).observe(document, { childList: true, subtree: true });
};

test.describe("built site (guide without JavaScript)", () => {
  test.use({ javaScriptEnabled: false });

  test("the built page carries the whole English guide", async ({ page }) => {
    await page.goto(`${ORIGIN}/tools/konfeti/docs/`);
    const sections = page.locator("#docs-content .docs-section");

    await expect(page.locator("#docs-content h2").first()).toContainText("API at a glance");
    expect(await sections.count()).toBeGreaterThan(10);
    expect(await page.locator("#docs-toc a").count()).toBe(await sections.count());
    await expect(page.locator("#version")).toHaveText(/^v\d+\.\d+\.\d+/);
  });
});

test.describe("built site (prerendered guide)", () => {
  test("English keeps the built guide and its buttons work", async ({ page, site }) => {
    await page.addInitScript(RECORD_CLIPBOARD);
    await page.addInitScript(RECORD_REMOVED_SECTIONS);
    await openSite(page, "docs/");

    await expect(page.locator("#docs-content h2").first()).toBeVisible();
    await expect(page.locator("#docs-toc a").first()).toBeVisible();
    await page.locator('#docs-content [data-action="copy"]').first().click();
    expect(await lastCopied(page)).not.toBe("");
    await page.locator('#docs-content [data-action="run"]').first().click();

    expect(
      await page.evaluate(
        () => (window as unknown as { removed: { count: number } }).removed.count,
      ),
    ).toBe(0);
    await expect(page.locator("#toast")).not.toHaveClass(/is-error/);
    expect(site.errors).toEqual([]);
  });

  test("Turkish replaces the built English guide", async ({ page, site }) => {
    await page.goto(`${ORIGIN}/tools/konfeti/docs/?lang=tr`);

    await expect(page.locator("#docs-content h2").first()).toContainText("Bir bakışta API");
    await expect(page.locator("#docs-content h2").first()).toBeVisible();
    await expect(page.locator("#docs-toc a").first()).toBeVisible();
    expect(site.errors).toEqual([]);
  });
});

test.describe("built site (crawler files)", () => {
  test("robots.txt and sitemap.xml are served from the site root", async ({ page }) => {
    await openSite(page, "docs/");
    const robots = await fetchSiteFile(page, "robots.txt");
    const sitemap = await fetchSiteFile(page, "sitemap.xml");
    const apiSitemap = await fetchSiteFile(page, "docs/api/sitemap.xml");

    expect(robots.status).toBe(200);
    expect(robots.text).toContain("Sitemap: https://konfeti.mbattaloglu.com/sitemap.xml");
    expect(sitemap.text).toContain("<loc>https://konfeti.mbattaloglu.com/docs/</loc>");
    expect(apiSitemap.text).toContain(
      "<loc>https://konfeti.mbattaloglu.com/docs/api/index.html</loc>",
    );
  });
});

test.describe("built site (LLM docs)", () => {
  test("every site link in llms.txt resolves to a built file", async ({ page }) => {
    await openSite(page, "docs/");
    const llms = await fetchSiteFile(page, "llms.txt");
    const siteLinks = [
      ...llms.text.matchAll(/\]\((https:\/\/konfeti\.mbattaloglu\.com\/[^)]*)\)/g),
    ].map((match) => (match[1] ?? "").slice("https://konfeti.mbattaloglu.com/".length));

    expect(llms.status).toBe(200);
    expect(siteLinks).toContain("docs/index.md");
    expect(siteLinks).toContain("llms-full.txt");

    for (const path of siteLinks) {
      expect((await fetchSiteFile(page, path)).status, path).toBe(200);
    }
  });

  test("the guide and the API reference are served as Markdown", async ({ page }) => {
    await openSite(page, "docs/");
    const guide = await fetchSiteFile(page, "docs/index.md");
    const full = await fetchSiteFile(page, "llms-full.txt");

    expect(guide.text).toContain("## API at a glance");
    expect(guide.text).not.toMatch(/^```ts run$/m);
    expect(full.text).toContain("## API at a glance");
    expect(full.text).toContain("# API reference: konfeti/worker");
    await expect(page.locator('link[rel="alternate"][type="text/markdown"]')).toHaveAttribute(
      "href",
      "https://konfeti.mbattaloglu.com/docs/index.md",
    );
  });
});
