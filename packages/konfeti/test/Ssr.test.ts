// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

describe("server-side rendering", () => {
  it("imports both entries without a DOM", async () => {
    expect(typeof window).toBe("undefined");
    expect(typeof document).toBe("undefined");
    vi.resetModules();

    const full = await import("../src/index");
    const lite = await import("../src/lite");

    expect(typeof full.Konfeti.fire).toBe("function");
    expect(full.KonfetiPresets.SNOW).toBeDefined();
    expect(typeof lite.KonfetiFactory.create).toBe("function");
  });

  it("answers read-only calls without creating a canvas", async () => {
    vi.resetModules();
    const { Konfeti } = await import("../src/index");

    expect(Konfeti.getParticleCount()).toBe(0);
    expect(Konfeti.isPaused()).toBe(false);
    expect(() => {
      Konfeti.reset();
    }).not.toThrow();
  });
});
