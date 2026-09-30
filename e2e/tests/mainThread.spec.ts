import { VERSION } from "../../packages/konfeti/src/Version";
import { expect, openPage, test } from "../support/site";

test.describe("main thread (ESM build)", () => {
  test("fires on the shared overlay and resolves when every particle is gone", async ({
    page,
    site,
  }) => {
    await openPage(page, "esm.html");

    const counts = await page.evaluate(async () => {
      const handle = window.konfeti.Konfeti.fire({ particleCount: 50, lifetime: 400 });
      const during = window.konfeti.Konfeti.getParticleCount();
      await handle;
      return { during, after: window.konfeti.Konfeti.getParticleCount() };
    });

    expect(counts).toEqual({ during: 50, after: 0 });
    expect(site.errors).toEqual([]);
  });

  test("logs the banner once, with version and renderer", async ({ page, site }) => {
    await openPage(page, "esm.html");

    await page.evaluate(async () => {
      await window.konfeti.Konfeti.fire({ particleCount: 5, lifetime: 100 });
      await window.konfeti.KonfetiFactory.create(document.querySelector("canvas")).fire({
        particleCount: 5,
        lifetime: 100,
      });
    });

    const banners = site.logs.filter((text) => text.includes("konfeti"));
    expect(banners).toHaveLength(1);
    expect(banners[0]).toContain(`v${VERSION} · canvas 2d`);
  });

  test("stays silent after disableBanner()", async ({ page, site }) => {
    await openPage(page, "esm.html");

    await page.evaluate(async () => {
      window.konfeti.disableBanner();
      await window.konfeti.Konfeti.fire({ particleCount: 5, lifetime: 100 });
    });

    expect(site.logs.filter((text) => text.includes("konfeti"))).toEqual([]);
  });

  test("draws on a user canvas", async ({ page, site }) => {
    await openPage(page, "esm.html");
    const stage = page.locator("#stage");
    const blank = await stage.screenshot();

    await page.evaluate(() => {
      const canvas = document.querySelector("canvas");
      void window.konfeti.KonfetiFactory.create(canvas).fire({
        particleCount: 120,
        lifetime: 3000,
        origin: { x: 0.5, y: 0.5 },
        startVelocity: [50, 150],
        shapes: [
          { type: "paper" },
          { type: "emoji", emoji: "🎉" },
          { type: "text", text: "YAY" },
          { type: "image", src: "/assets/coin.png" },
        ],
      });
    });
    await expect.poll(async () => (await stage.screenshot()).equals(blank)).toBe(false);

    expect(site.errors).toEqual([]);
  });

  test("does not download the worker script until createWorker() is called", async ({
    page,
    site,
  }) => {
    await openPage(page, "esm.html");

    await page.evaluate(async () => {
      await window.konfeti.Konfeti.fire({ particleCount: 10, lifetime: 100 });
    });

    expect(site.requests.filter((path) => /spawnWorker|konfeti\.worker/.test(path))).toEqual([]);
  });

  test("pause() freezes the burst and resume() finishes it", async ({ page }) => {
    await openPage(page, "esm.html");

    const result = await page.evaluate(async () => {
      const { Konfeti } = window.konfeti;
      const handle = Konfeti.fire({ particleCount: 20, lifetime: 300 });
      Konfeti.pause();
      // longer than the lifetime: without pause every particle would be gone
      await new Promise((resolve) => setTimeout(resolve, 600));
      const whilePaused = Konfeti.getParticleCount();
      Konfeti.resume();
      await handle;
      return { whilePaused, after: Konfeti.getParticleCount() };
    });

    expect(result).toEqual({ whilePaused: 20, after: 0 });
  });

  test("onClick with trigger pointerdown fires on a real tap and hands over the burst", async ({
    page,
  }) => {
    await openPage(page, "esm.html");
    await page.evaluate(() => {
      const stage = document.querySelector("canvas");
      (window as unknown as { fired: number }).fired = 0;
      window.konfeti.Konfeti.onClick(
        stage ?? window,
        { particleCount: 7, lifetime: 200 },
        {
          trigger: "pointerdown",
          onFire: (handle) => {
            (window as unknown as { fired: number }).fired += handle.getParticleCount();
          },
        },
      );
    });

    await page.locator("#stage").click();

    expect(await page.evaluate(() => (window as unknown as { fired: number }).fired)).toBe(7);
  });

  test("emit() streams from the pointer until stopped, then finishes", async ({ page }) => {
    await openPage(page, "esm.html");
    await page.evaluate(() => {
      const trail = window.konfeti.Konfeti.emit({ rate: 120, lifetime: 300, follow: "pointer" });
      (window as unknown as { trail: typeof trail }).trail = trail;
    });

    // nothing before the pointer shows up
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.konfeti.Konfeti.getParticleCount())).toBe(0);

    await page.mouse.move(200, 150);
    await page.mouse.move(260, 180);
    await expect
      .poll(() => page.evaluate(() => window.konfeti.Konfeti.getParticleCount()))
      .toBeGreaterThan(0);

    const finished = await page.evaluate(async () => {
      const trail = (window as unknown as { trail: { stop(): void } & PromiseLike<void> }).trail;
      trail.stop();
      await trail;
      return window.konfeti.Konfeti.getParticleCount();
    });
    expect(finished).toBe(0);
  });

  test("decodes and draws an inline <svg> image", async ({ page, site }) => {
    await openPage(page, "esm.html");
    const stage = page.locator("#stage");
    const blank = await stage.screenshot();

    await page.evaluate(() => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="10" fill="gold"/></svg>';
      void window.konfeti.KonfetiFactory.create(document.querySelector("canvas")).fire({
        particleCount: 30,
        lifetime: 3000,
        startVelocity: [50, 150],
        origin: { x: 0.5, y: 0.5 },
        shapes: [{ type: "image", src: svg, size: 20 }],
      });
    });

    await expect.poll(async () => (await stage.screenshot()).equals(blank)).toBe(false);
    expect(site.errors).toEqual([]);
  });
});
