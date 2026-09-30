import type { Page } from "@playwright/test";

import { inkCenter } from "../support/ink";
import { expect, openPage, test } from "../support/site";

/**
 * Font Used by the Text Formation Tests.
 */
const FONT = "900 100px sans-serif";

/**
 * Measure the Text's Own Ink Box in the Page (the same font drawn on a canvas).
 *
 * @param page - Page
 * @param text - Text
 * @returns Width and Height in CSS Pixels
 */
async function textBox(page: Page, text: string): Promise<{ width: number; height: number }> {
  return page.evaluate(
    ([value, font]) => {
      const context = document.createElement("canvas").getContext("2d");

      if (context === null) {
        throw new Error("no 2d context");
      }

      context.font = font;
      const metrics = context.measureText(value);
      return {
        width: metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
        height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
      };
    },
    [text, FONT] as const,
  );
}

/**
 * Wait until Something Is Drawn, then Measure It.
 *
 * @param page - Page
 * @returns Ink of the 400 × 300 Stage
 */
async function drawnInk(page: Page): Promise<Awaited<ReturnType<typeof inkCenter>>> {
  const stage = page.locator("#stage");
  await expect
    .poll(async () => (await inkCenter(page, await stage.screenshot())).count)
    .toBeGreaterThan(500);
  return inkCenter(page, await stage.screenshot());
}

/**
 * Check that the Ink Has the Text's Size and Sits on the Stage Center.
 *
 * @param ink - Measured Ink
 * @param expected - The Text's Own Width and Height
 */
function expectTextShape(
  ink: Awaited<ReturnType<typeof inkCenter>>,
  expected: { width: number; height: number },
): void {
  const width = ink.right - ink.left;
  const height = ink.bottom - ink.top;

  // the pieces reach a few pixels past the letter outlines, so allow a little more than the text itself
  expect(width).toBeGreaterThan(expected.width * 0.85);
  expect(width).toBeLessThan(expected.width * 1.3);
  expect(height).toBeGreaterThan(expected.height * 0.85);
  expect(height).toBeLessThan(expected.height * 1.4);
  expect(Math.abs((ink.left + ink.right) / 2 - 200)).toBeLessThan(12);
  expect(Math.abs((ink.top + ink.bottom) / 2 - 150)).toBeLessThan(12);
}

test.describe("formations (ESM build)", () => {
  test("spell the text around the origin and hold it", async ({ page, site }) => {
    await openPage(page, "esm.html");
    await page.evaluate((font) => {
      const stage = window.konfeti.KonfetiFactory.create(document.querySelector("canvas"));
      void stage.fire({
        origin: { x: 0.5, y: 0.5 },
        formation: { text: "HI", font, mode: "appear", hold: 20_000 },
      });
    }, FONT);

    expectTextShape(await drawnInk(page), await textBox(page, "HI"));
    expect(site.errors).toEqual([]);
  });

  test("form in a worker too", async ({ page, site }) => {
    await openPage(page, "esm.html");
    const isWorker = await page.evaluate((font) => {
      const stage = window.konfeti.createWorker(document.querySelector("canvas"));
      void stage.fire({
        origin: { x: 0.5, y: 0.5 },
        formation: { text: "HI", font, mode: "appear", hold: 20_000 },
      });
      return stage.isWorker();
    }, FONT);

    expect(isWorker).toBe(true);
    expectTextShape(await drawnInk(page), await textBox(page, "HI"));
    expect(site.errors).toEqual([]);
  });

  test("trace an image URL once it has loaded, in the image's colors", async ({ page, site }) => {
    await openPage(page, "esm.html");
    await page.evaluate(() => {
      const stage = window.konfeti.KonfetiFactory.create(document.querySelector("canvas"));
      void stage.fire({
        origin: { x: 0.5, y: 0.5 },
        formation: { image: "/assets/coin.png", width: 120, mode: "appear", hold: 20_000 },
      });
    });

    const ink = await drawnInk(page);
    // the 16 px gold square, drawn 120 px wide
    expect(ink.right - ink.left).toBeGreaterThan(110);
    expect(ink.right - ink.left).toBeLessThan(145);
    expect(ink.bottom - ink.top).toBeGreaterThan(110);
    expect(ink.bottom - ink.top).toBeLessThan(145);
    // gold (255, 196, 0) and its darker back side, not the default rainbow palette
    expect(ink.red).toBeGreaterThan(150);
    expect(ink.blue).toBeLessThan(60);
    expect(site.requests).toContain("/assets/coin.png");
    expect(site.errors).toEqual([]);
  });
});
