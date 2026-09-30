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
