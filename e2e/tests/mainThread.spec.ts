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
});
