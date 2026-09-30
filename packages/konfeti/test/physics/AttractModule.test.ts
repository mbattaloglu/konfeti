import { afterEach, describe, expect, it, vi } from "vitest";

import type { Burst } from "../../src/core/Burst";
import { KonfetiInstance } from "../../src/core/KonfetiInstance";
import { PhysicsResolver } from "../../src/core/resolve/PhysicsResolver";
import type { FireOptions } from "../../src/types/FireOptions";
import { ManualScheduler } from "../helpers/ManualScheduler";

const instances: KonfetiInstance[] = [];

/**
 * Create Test Instance with Manual Scheduler.
 *
 * @returns Instance and Scheduler
 */
function setup(): { konfeti: KonfetiInstance; scheduler: ManualScheduler } {
  const scheduler = new ManualScheduler();
  const konfeti = new KonfetiInstance(null, { frameScheduler: scheduler });
  instances.push(konfeti);
  return { konfeti, scheduler };
}

/**
 * Motionless Burst Settings: only the attractor moves particles.
 */
const STILL: FireOptions = {
  particleCount: 5,
  startVelocity: 0,
  lifetime: 60_000,
  origin: { x: 0.5, y: 0.8 },
  physics: { gravity: 0, drag: 0, wind: 0 },
};

/**
 * Average Particle Y of a Burst.
 *
 * @param burst - Burst
 * @returns Mean Y in Canvas Pixels
 */
function meanY(burst: Burst): number {
  const particles = burst.getParticles();
  return particles.reduce((sum, particle) => sum + particle.y, 0) / particles.length;
}

afterEach(() => {
  for (const instance of instances.splice(0)) {
    instance.destroy();
  }
  vi.restoreAllMocks();
});

describe("physics.attract", () => {
  it("pulls particles toward a point target", () => {
    const { konfeti, scheduler } = setup();
    const burst = konfeti.fire({
      ...STILL,
      physics: { ...STILL.physics, attract: { target: { x: 0.5, y: 0.1 }, strength: 2000 } },
    }) as Burst;
    const start = meanY(burst);

    scheduler.step(10);

    expect(meanY(burst)).toBeLessThan(start - 5);
  });

  it("pushes particles away with a negative strength", () => {
    const { konfeti, scheduler } = setup();
    const burst = konfeti.fire({
      ...STILL,
      physics: { ...STILL.physics, attract: { target: { x: 0.5, y: 0.1 }, strength: -2000 } },
    }) as Burst;
    const start = meanY(burst);

    scheduler.step(10);

    expect(meanY(burst)).toBeGreaterThan(start + 5);
  });

  it("ignores particles beyond the radius", () => {
    const { konfeti, scheduler } = setup();
    const burst = konfeti.fire({
      ...STILL,
      physics: {
        ...STILL.physics,
        attract: { target: { x: 0.5, y: 0.1 }, strength: 2000, radius: 10 },
      },
    }) as Burst;
    const start = meanY(burst);

    scheduler.step(10);

    expect(meanY(burst)).toBeCloseTo(start, 5);
  });

  it("pulls weaker toward the edge with linear falloff", () => {
    const pull = (falloff: "constant" | "linear"): number => {
      const { konfeti, scheduler } = setup();
      const burst = konfeti.fire({
        ...STILL,
        physics: {
          ...STILL.physics,
          attract: { target: { x: 0.5, y: 0.1 }, strength: 2000, radius: 2000, falloff },
        },
      }) as Burst;
      const start = meanY(burst);
      scheduler.step(5);
      return start - meanY(burst);
    };

    expect(pull("linear")).toBeGreaterThan(0);
    expect(pull("linear")).toBeLessThan(pull("constant"));
  });

  it("follows the pointer only after it moves, and drops its listeners when the burst ends", async () => {
    const { konfeti, scheduler } = setup();
    const remove = vi.spyOn(window, "removeEventListener");
    const burst = konfeti.fire({
      ...STILL,
      lifetime: 400,
      physics: { ...STILL.physics, attract: { target: "pointer", strength: 3000 } },
    }) as Burst;
    const start = meanY(burst);

    scheduler.step(5);
    expect(meanY(burst)).toBeCloseTo(start, 5);

    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 512, clientY: 0 }));
    scheduler.step(5);
    expect(meanY(burst)).toBeLessThan(start - 1);

    scheduler.step(60);
    await burst;
    expect(remove.mock.calls.map(([type]) => type)).toEqual(
      expect.arrayContaining(["pointermove", "pointerdown"]),
    );
  });

  it("resolves `true` to the defaults and rejects a bad radius", () => {
    expect(PhysicsResolver.resolve([{ attract: true }]).attract).toEqual({
      target: "pointer",
      strength: [900, 900],
      radius: Infinity,
      falloff: "constant",
    });
    expect(PhysicsResolver.resolve([{}]).attract).toBeNull();
    expect(() => PhysicsResolver.resolve([{ attract: { radius: 0 } }])).toThrow(
      /"physics.attract.radius" must be a positive number/,
    );
  });
});
