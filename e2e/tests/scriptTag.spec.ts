import { expect, openPage, test } from "../support/site";

test.describe("<script> build (IIFE)", () => {
  test("exposes window.konfeti and fires", async ({ page, site }) => {
    await openPage(page, "iife.html");

    const counts = await page.evaluate(async () => {
      const handle = window.konfeti.Konfeti.fire({ particleCount: 25, lifetime: 200 });
      const during = window.konfeti.Konfeti.getParticleCount();
      await handle;
      return { during, after: window.konfeti.Konfeti.getParticleCount() };
    });

    expect(counts).toEqual({ during: 25, after: 0 });
    expect(site.errors).toEqual([]);
  });

  test("loads konfeti.worker.js from next to the script", async ({ page, site }) => {
    await openPage(page, "iife.html");

    const isWorker = await page.evaluate(async () => {
      const worker = window.konfeti.createWorker(document.querySelector("canvas"));
      await worker.fire({ particleCount: 30, lifetime: 300 });
      return worker.isWorker();
    });

    expect(isWorker).toBe(true);
    expect(site.requests).toContain("/dist/konfeti.worker.js");
    expect(site.errors).toEqual([]);
  });
});
