import type { Page } from "@playwright/test";

import { inkCenter } from "../support/ink";
import { expect, openPage, test } from "../support/site";

/**
 * Fire Still, Tinted Copies of the Gold Test Square (255, 196, 0) and Measure the Drawn Ink.
 *
 * @param page - Page
 * @param tint - Tint Option
 * @param color - Tint Color
 * @param inWorker - Render in a Worker Instance
 * @returns Ink of the 400 × 300 Stage
 */
async function tintedInk(
  page: Page,
  tint: true | "fill",
  color: `#${string}`,
  inWorker = false,
): Promise<Awaited<ReturnType<typeof inkCenter>>> {
  await openPage(page, "esm.html");
  await page.evaluate(
    ([tintOption, tintColor, worker]) => {
      const canvas = document.querySelector("canvas");

      if (canvas === null) {
        throw new Error("no stage");
      }

      const stage = worker
        ? window.konfeti.createWorker(canvas)
        : window.konfeti.KonfetiFactory.create(canvas);
      void stage.fire({
        particleCount: 30,
        origin: { x: 0.5, y: 0.5 },
        spread: 360,
        startVelocity: [40, 120],
        lifetime: 20_000,
        physics: { gravity: 0, drag: 3 },
        shapes: [
          {
            type: "image",
            src: "/assets/coin.png",
            size: 24,
            tint: tintOption,
            colors: [tintColor],
            rotation: 0,
            rotationSpeed: 0,
            fadeOut: false,
          },
        ],
      });
    },
    [tint, color, inWorker] as const,
  );
  const stage = page.locator("#stage");
  await expect
    .poll(async () => (await inkCenter(page, await stage.screenshot())).count)
    .toBeGreaterThan(500);

  return inkCenter(page, await stage.screenshot());
}

test.describe("image tint", () => {
  test("fill paints the image in the particle color", async ({ page, site }) => {
    const ink = await tintedInk(page, "fill", "#0000ff");

    // the gold square drawn blue
    expect(ink.blue).toBeGreaterThan(200);
    expect(ink.red).toBeLessThan(40);
    expect(site.errors).toEqual([]);
  });

  test("multiply keeps the shading: gold times grey is a darker gold", async ({ page, site }) => {
    const ink = await tintedInk(page, true, "#808080");

    // 255 × 128 / 255 ≈ 128 red, still no blue
    expect(ink.red).toBeGreaterThan(100);
    expect(ink.red).toBeLessThan(160);
    expect(ink.blue).toBeLessThan(40);
    expect(site.errors).toEqual([]);
  });

  test("tints in a worker too", async ({ page, site }) => {
    const ink = await tintedInk(page, "fill", "#0000ff", true);

    expect(ink.blue).toBeGreaterThan(200);
    expect(ink.red).toBeLessThan(40);
    expect(site.errors).toEqual([]);
  });
});
