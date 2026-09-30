import type { Page } from "@playwright/test";

import { VERSION } from "../../packages/konfeti/src/Version";
import { expect, openPage, test } from "../support/site";

/**
 * Where the Drawn Particles Are in a Screenshot.
 */
type InkCenter = {
  /**
   * Mean X of the Drawn Pixels (CSS px from the screenshot's left edge).
   */
  readonly x: number;
  /**
   * Mean Y of the Drawn Pixels (CSS px from the screenshot's top edge).
   */
  readonly y: number;
  /**
   * Number of Drawn Pixels.
   */
  readonly count: number;
};

/**
 * Find the Center of Everything Drawn on a White Page.
 * The PNG is decoded in the page (the test runner has no image decoder); any clearly colored pixel counts as
 * confetti, since every default color has a strong channel far from white.
 *
 * @param page - Page Used for Decoding
 * @param png - Screenshot
 * @returns Center and Count of the Drawn Pixels
 */
async function inkCenter(page: Page, png: Buffer): Promise<InkCenter> {
  return page.evaluate(async (base64) => {
    const response = await fetch(`data:image/png;base64,${base64}`);
    const bitmap = await createImageBitmap(await response.blob());
    const context = new OffscreenCanvas(bitmap.width, bitmap.height).getContext("2d");

    if (context === null) {
      throw new Error("no 2d context");
    }

    context.drawImage(bitmap, 0, 0);
    const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height);
    let sumX = 0;
    let sumY = 0;
    let count = 0;

    for (let index = 0; index < data.length; index += 4) {
      const darkest = Math.min(data[index] ?? 255, data[index + 1] ?? 255, data[index + 2] ?? 255);

      if (darkest < 200) {
        const pixel = index / 4;
        sumX += pixel % bitmap.width;
        sumY += Math.floor(pixel / bitmap.width);
        count++;
      }
    }

    return { x: sumX / Math.max(count, 1), y: sumY / Math.max(count, 1), count };
  }, png.toString("base64"));
}

test.describe("worker rendering (ESM build)", () => {
  test("renders in a worker and resolves the burst", async ({ page, site }) => {
    await openPage(page, "esm.html");
    const stage = page.locator("#stage");
    const blank = await stage.screenshot();

    const result = await page.evaluate(async () => {
      const worker = window.konfeti.createWorker(document.querySelector("canvas"));
      const handle = worker.fire({
        particleCount: 120,
        lifetime: 1200,
        origin: { x: 0.5, y: 0.5 },
        startVelocity: [50, 150],
        shapes: [
          { type: "paper" },
          { type: "emoji", emoji: "🎉" },
          { type: "text", text: "YAY" },
          { type: "image", src: "/assets/coin.png" },
        ],
      });
      // worker counts arrive with the stats message (every 200 ms)
      await new Promise((resolve) => setTimeout(resolve, 400));
      const during = worker.getParticleCount();
      void handle;
      return { isWorker: worker.isWorker(), during };
    });

    expect(result.isWorker).toBe(true);
    expect(result.during).toBeGreaterThan(0);
    await expect.poll(async () => (await stage.screenshot()).equals(blank)).toBe(false);
    expect(site.requests.some((path) => path.includes("spawnWorker"))).toBe(true);
    // the worker fetches URL images itself (no Image element there)
    await expect.poll(() => site.requests).toContain("/assets/coin.png");
    expect(site.errors).toEqual([]);
    expect(site.logs.find((text) => text.includes("konfeti"))).toContain(
      `v${VERSION} · worker · offscreen canvas 2d`,
    );
  });

  test("the burst promise resolves once the worker finishes", async ({ page }) => {
    await openPage(page, "esm.html");

    const outcome = await page.evaluate(async () => {
      const worker = window.konfeti.createWorker(document.querySelector("canvas"));
      await worker.fire({ particleCount: 30, lifetime: 300 });
      // counters arrive with the next stats report
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        isWorker: worker.isWorker(),
        left: worker.getParticleCount(),
        stats: worker.getStats(),
      };
    });

    expect(outcome.isWorker).toBe(true);
    expect(outcome.left).toBe(0);
    expect(outcome.stats).toEqual({ live: 0, spawned: 30, died: 30, completed: 1 });
  });

  test("rejects the burst when the worker reports invalid options", async ({ page }) => {
    await openPage(page, "esm.html");

    const message = await page.evaluate(async () => {
      const worker = window.konfeti.createWorker(document.querySelector("canvas"));
      try {
        await worker.fire({ paper: { colors: "nope" as "red" } });
        return "resolved";
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    });

    expect(message).toMatch(/invalid color/);
  });

  test("fails clearly instead of hanging when the worker script cannot load", async ({ page }) => {
    await openPage(page, "esm.html");

    const message = await page.evaluate(async () => {
      const worker = window.konfeti.createWorker(document.querySelector("canvas"), {
        workerUrl: "/missing-worker.js",
      });
      try {
        await worker.fire({ particleCount: 10 });
        return "resolved";
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    });

    expect(message).toMatch(/worker script failed to load/);
  });

  test("falls back to the main thread without OffscreenCanvas", async ({ page, site }) => {
    await page.addInitScript(() => {
      Reflect.deleteProperty(window, "OffscreenCanvas");
    });
    await openPage(page, "esm.html");

    const result = await page.evaluate(async () => {
      const worker = window.konfeti.createWorker(document.querySelector("canvas"));
      const handle = worker.fire({ particleCount: 20, lifetime: 200 });
      const during = worker.getParticleCount();
      await handle;
      return { isWorker: worker.isWorker(), during };
    });

    expect(result).toEqual({ isWorker: false, during: 20 });
    expect(site.errors).toEqual([]);
  });

  test("physics.attract pulls toward the pointer in the worker", async ({ page }) => {
    await openPage(page, "esm.html");
    const stage = page.locator("#stage");

    await page.evaluate(() => {
      const worker = window.konfeti.createWorker(document.querySelector("canvas"));
      // no launch speed and no gravity: only the attractor moves the particles
      void worker.fire({
        particleCount: 40,
        lifetime: 20_000,
        startVelocity: 0,
        origin: { x: 0.5, y: 0.5 },
        physics: { gravity: 0, attract: { target: "pointer", strength: 4000 } },
      });
    });

    // until the pointer moves, the worker has no target: the particles wait at the origin (200, 150)
    await expect
      .poll(async () => (await inkCenter(page, await stage.screenshot())).count)
      .toBeGreaterThan(0);
    const waiting = await inkCenter(page, await stage.screenshot());
    expect(Math.hypot(waiting.x - 200, waiting.y - 150)).toBeLessThan(25);

    await page.mouse.move(60, 50);
    await expect
      .poll(async () => {
        const center = await inkCenter(page, await stage.screenshot());
        return Math.hypot(center.x - 60, center.y - 50);
      })
      .toBeLessThan(30);
  });

  test("emit() streams in the worker and follows the pointer", async ({ page }) => {
    await openPage(page, "esm.html");
    await page.evaluate(() => {
      const worker = window.konfeti.createWorker(document.querySelector("canvas"));
      const trail = worker.emit({ rate: 120, lifetime: 400, follow: "pointer" });
      Object.assign(window, { worker, trail });
    });

    await page.mouse.move(100, 100);
    await page.mouse.move(180, 140);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { worker: { getStats(): { spawned: number } } }).worker.getStats()
              .spawned,
        ),
      )
      .toBeGreaterThan(0);

    const stats = await page.evaluate(async () => {
      const { worker, trail } = window as unknown as {
        worker: { getStats(): { live: number; completed: number } };
        trail: { stop(): void } & PromiseLike<void>;
      };
      trail.stop();
      await trail;
      await new Promise((resolve) => setTimeout(resolve, 300));
      return worker.getStats();
    });
    expect(stats.completed).toBe(1);
    expect(stats.live).toBe(0);
  });
});
