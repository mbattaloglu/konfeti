import { afterEach, describe, expect, it, vi } from "vitest";

import type { Burst } from "../../src/core/Burst";
import { KonfetiInstance } from "../../src/core/KonfetiInstance";
import { OptionResolver } from "../../src/core/resolve/OptionResolver";
import { Particle } from "../../src/particles/Particle";
import { TrailRecorder } from "../../src/particles/TrailRecorder";
import { ManualScheduler } from "../helpers/ManualScheduler";

const instances: KonfetiInstance[] = [];

afterEach(() => {
  for (const instance of instances.splice(0)) {
    instance.destroy();
  }
  vi.restoreAllMocks();
});

/**
 * Resolve the Paper Style's Trail of a Burst.
 *
 * @param trail - Trail Option
 * @returns Resolved Trail
 */
function resolvedTrail(trail: unknown): unknown {
  const options = OptionResolver.resolveFire([{ paper: { trail } } as never]);
  return options.shapes.items[0]?.style.trail;
}

describe("trail", () => {
  it("resolves `true` to the defaults, clamps the length and parses the color", () => {
    expect(resolvedTrail(true)).toEqual({ length: 10, width: [3, 3], opacity: 0.5, color: null });
    expect(resolvedTrail(false)).toBeNull();
    expect(resolvedTrail({ length: 100 })).toMatchObject({ length: 32 });
    expect(resolvedTrail({ length: 1 })).toMatchObject({ length: 2 });
    expect(resolvedTrail({ color: "gold", opacity: 3 })).toMatchObject({ opacity: 1 });
    expect((resolvedTrail({ color: "gold" }) as { color: string }).color).toMatch(/rgb|#/);
  });

  it("keeps the last `length` positions in a ring buffer", () => {
    const particle = new Particle();
    particle.trailX = new Float32Array(32);
    particle.trailY = new Float32Array(32);
    particle.trailLength = 3;

    for (let step = 1; step <= 5; step++) {
      particle.x = step;
      TrailRecorder.record(particle);
    }

    expect(particle.trailCount).toBe(3);
    // positions 3, 4, 5 remain; the next write goes to slot 5 % 3 = 2
    expect([...particle.trailX.slice(0, 3)].sort()).toEqual([3, 4, 5]);
    expect(particle.trailHead).toBe(2);
  });

  it("strokes the trail behind moving particles — and nothing without one", () => {
    const scheduler = new ManualScheduler();
    const canvas = document.createElement("canvas");
    const konfeti = new KonfetiInstance(canvas, { frameScheduler: scheduler });
    instances.push(konfeti);
    const context = canvas.getContext("2d");

    if (context === null) {
      throw new Error("no 2D context");
    }

    const stroke = vi.spyOn(context, "stroke");
    konfeti.fire({ particleCount: 4, lifetime: 5000 });
    scheduler.step(6);
    expect(stroke).not.toHaveBeenCalled();

    konfeti.fire({ particleCount: 4, lifetime: 5000, paper: { trail: { length: 5 } } });
    scheduler.step(6);
    expect(stroke).toHaveBeenCalled();
  });

  it("does not reallocate the buffers when a pooled particle is reused", () => {
    const scheduler = new ManualScheduler();
    const konfeti = new KonfetiInstance(null, { frameScheduler: scheduler });
    instances.push(konfeti);

    const first = konfeti.fire({ particleCount: 1, lifetime: 50, paper: { trail: true } }) as Burst;
    scheduler.step(2);
    const buffer = first.getParticles()[0]?.trailX;
    expect(buffer).toBeInstanceOf(Float32Array);
    scheduler.step(20);

    const second = konfeti.fire({
      particleCount: 1,
      lifetime: 50,
      paper: { trail: true },
    }) as Burst;
    expect(second.getParticles()[0]?.trailX).toBe(buffer);
    expect(second.getParticles()[0]?.trailCount).toBeLessThanOrEqual(1);
  });
});
