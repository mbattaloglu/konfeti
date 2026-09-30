import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Burst } from "../../src/core/Burst";
import { KonfetiInstance } from "../../src/core/KonfetiInstance";
import type { FireOptions } from "../../src/types/FireOptions";
import { ManualScheduler } from "../helpers/ManualScheduler";

const instances: KonfetiInstance[] = [];

/**
 * Create Test Instance with Manual Scheduler.
 *
 * @param maxParticles - Maximum Live Particles
 * @returns Instance and Scheduler
 */
function setup(maxParticles = 5000): { konfeti: KonfetiInstance; scheduler: ManualScheduler } {
  const scheduler = new ManualScheduler();
  const konfeti = new KonfetiInstance(null, { frameScheduler: scheduler, maxParticles });
  instances.push(konfeti);
  return { konfeti, scheduler };
}

/**
 * Still Burst: no gravity or drag, so only the formation moves the particles.
 */
const STILL: FireOptions = { physics: { gravity: 0, drag: 0, wind: 0 }, lifetime: 60_000 };

beforeEach(() => {
  // the canvas mock measures every text as 0 × 0 and reads back empty pixels: give the text a real size
  // and make every pixel of it opaque
  vi.spyOn(CanvasRenderingContext2D.prototype, "measureText").mockReturnValue({
    width: 200,
    actualBoundingBoxLeft: 0,
    actualBoundingBoxRight: 200,
    fontBoundingBoxAscent: 80,
    fontBoundingBoxDescent: 20,
    actualBoundingBoxAscent: 80,
    actualBoundingBoxDescent: 20,
  } as TextMetrics);
  vi.spyOn(CanvasRenderingContext2D.prototype, "getImageData").mockImplementation(
    (_x: number, _y: number, width: number, height: number) =>
      ({ width, height, data: new Uint8ClampedArray(width * height * 4).fill(255) }) as ImageData,
  );
});

afterEach(() => {
  for (const instance of instances.splice(0)) {
    instance.destroy();
  }
  vi.restoreAllMocks();
});

describe("formation bursts", () => {
  it("forms the text, holds it without aging, then releases the particles", async () => {
    const { konfeti, scheduler } = setup();
    const burst = konfeti.fire({
      ...STILL,
      formation: { text: "HI", mode: "appear", hold: 300 },
    }) as Burst;
    const particles = burst.getParticles();
    const start = particles.map((particle) => [particle.x, particle.y]);

    // 204 × 104 px of text at the default 8 px spacing
    expect(particles.length).toBe(25 * 13);
    expect(particles.every((particle) => particle.isForming)).toBe(true);

    scheduler.step(12);
    expect(particles.map((particle) => [particle.x, particle.y])).toEqual(start);
    expect(particles.every((particle) => particle.age === 0)).toBe(true);

    scheduler.step(10);
    expect(particles.some((particle) => particle.isForming)).toBe(false);
    expect(particles.every((particle) => particle.age > 0)).toBe(true);
    expect(particles.map((particle) => [particle.x, particle.y])).not.toEqual(start);

    burst.stop();
    scheduler.step();
    await expect(burst).resolves.toBeUndefined();
  });

  it("caps the shape with an explicit particleCount", () => {
    const { konfeti } = setup();
    const burst = konfeti.fire({ ...STILL, particleCount: 40, formation: { text: "HI" } }) as Burst;

    expect(burst.getParticleCount()).toBe(40);
  });

  it("is limited by maxParticles and thins the whole shape out", () => {
    const { konfeti } = setup(50);
    const burst = konfeti.fire({ ...STILL, formation: { text: "HI", mode: "appear" } }) as Burst;
    const xs = burst.getParticles().map((particle) => particle.formationToX);

    expect(xs).toHaveLength(50);
    // the kept particles still span the whole word, not only its first rows or letters
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(150);
  });

  it("waits for an image that is still loading", () => {
    const { konfeti, scheduler } = setup();
    const logo = document.createElement("canvas");
    logo.width = 0;
    logo.height = 0;
    const burst = konfeti.fire({ ...STILL, formation: { image: logo } }) as Burst;

    scheduler.step(3);
    expect(burst.getParticleCount()).toBe(0);
    expect(burst.isFinished()).toBe(false);

    logo.width = 80;
    logo.height = 40;
    scheduler.step();
    expect(burst.getParticleCount()).toBe(10 * 5);
  });

  it("ends a burst whose image failed to load, without particles", async () => {
    const { konfeti, scheduler } = setup();
    const broken = document.createElement("img");
    Object.defineProperty(broken, "complete", { value: true });
    const burst = konfeti.fire({ ...STILL, formation: { image: broken } });

    scheduler.step();
    await expect(burst).resolves.toBeUndefined();
    expect(burst.getParticleCount()).toBe(0);
  });

  it("rejects invalid formations", () => {
    const { konfeti } = setup();

    expect(() => konfeti.fire({ formation: {} as never })).toThrow(/either "text" or "image"/);
    expect(() => konfeti.fire({ formation: { text: "A", image: "/a.png" } as never })).toThrow(
      /not both/,
    );
    expect(() => konfeti.fire({ formation: { text: "  " } })).toThrow(/non-empty/);
    expect(() => konfeti.fire({ formation: { text: "A", spacing: 0 } })).toThrow(/spacing/);
    expect(() => konfeti.fire({ formation: { text: "A", hold: -1 } })).toThrow(/hold/);
    expect(() => konfeti.fire({ formation: { text: "A", mode: "spin" as never } })).toThrow(
      /"assemble" or "appear"/,
    );
    expect(() =>
      konfeti.fire({
        formation: { text: "A" },
        emission: { mode: "stream", duration: 500 },
      }),
    ).toThrow(/emission mode "burst"/);
  });

  it("is not part of konfeti/lite until enableFormations() is called", async () => {
    vi.resetModules();
    const lite = await import("../../src/lite");
    const stage = new lite.KonfetiInstance(null, { frameScheduler: new ManualScheduler() });

    expect(() => stage.fire({ formation: { text: "A" } })).toThrow(/enableFormations\(\)/);
    lite.enableFormations();
    expect(stage.fire({ formation: { text: "A" } }).getParticleCount()).toBeGreaterThan(0);
    stage.destroy();
  });
});
