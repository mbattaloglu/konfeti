import { afterEach, describe, expect, it, vi } from "vitest";

import type { Banner as BannerClass } from "../../src/utils/Banner";

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

/**
 * Import a Fresh Banner (the setup file already disabled the shared one).
 *
 * @returns Banner Class
 */
async function freshBanner(): Promise<typeof BannerClass> {
  vi.resetModules();
  return (await import("../../src/utils/Banner")).Banner;
}

describe("Banner", () => {
  it("prints the version and renderer once per page", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const Banner = await freshBanner();

    Banner.show("canvas 2d");
    Banner.show("canvas 2d");

    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0]?.[0]).toMatch(/konfeti[\s\S]*v\d+\.\d+\.\d+ · canvas 2d %chttps:/);
  });

  it("stays silent after disable()", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const Banner = await freshBanner();

    Banner.disable();
    Banner.show("canvas 2d");

    expect(log).not.toHaveBeenCalled();
  });
});
