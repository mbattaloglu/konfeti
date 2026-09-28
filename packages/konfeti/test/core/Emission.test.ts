import { afterEach, describe, expect, it, vi } from "vitest";

import type { Burst } from "../../src/core/Burst";
import { KonfetiInstance } from "../../src/core/KonfetiInstance";
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

afterEach(() => {
  for (const instance of instances.splice(0)) {
    instance.destroy();
  }
});

describe("emission modes", () => {
  it("streams particles evenly over the duration", () => {
    const { konfeti, scheduler } = setup();
    const handle = konfeti.fire({
      particleCount: 60,
      lifetime: 10000,
      emission: { mode: "stream", duration: 1000 },
    });

    expect(handle.getParticleCount()).toBe(1);
    scheduler.step(30); // ~500ms
    expect(handle.getParticleCount()).toBeGreaterThan(25);
    expect(handle.getParticleCount()).toBeLessThan(35);
    scheduler.step(40);
    expect(handle.getParticleCount()).toBe(60);
  });

  it("fires interval shots, sampling the origin once per shot", () => {
    const { konfeti, scheduler } = setup();
    const handle = konfeti.fire({
      particleCount: 5,
      lifetime: 10000,
      spread: 0,
      startVelocity: 0,
      origin: { x: [0, 1], y: [0, 1] },
      emission: { mode: "interval", every: 100, times: 3 },
    }) as Burst;

    const first = handle.getParticles().map((particle) => particle.x);
    expect(new Set(first).size).toBe(1);

    scheduler.step(15); // 250ms → shots at 0, 100, 200
    expect(handle.getParticleCount()).toBe(15);
    expect(handle.isEmissionDone()).toBe(true);
  });

  it("stop() cancels pending emission", () => {
    const { konfeti, scheduler } = setup();
    const handle = konfeti.fire({
      particleCount: 100,
      emission: { mode: "stream", duration: 1000 },
    });

    handle.stop();
    scheduler.step(5);
    expect(handle.isFinished()).toBe(true);
    expect(konfeti.getParticleCount()).toBe(0);
  });
});

describe("hooks", () => {
  it("reports start, spawn, update, death and complete", () => {
    const { konfeti, scheduler } = setup();
    const hooks = {
      onStart: vi.fn(),
      onParticleSpawn: vi.fn(),
      onParticleUpdate: vi.fn(),
      onParticleDeath: vi.fn(),
      onComplete: vi.fn(),
    };

    konfeti.fire({ particleCount: 4, lifetime: 100, ...hooks });
    scheduler.step(20);

    expect(hooks.onStart).toHaveBeenCalledTimes(1);
    expect(hooks.onParticleSpawn).toHaveBeenCalledTimes(4);
    expect(hooks.onParticleUpdate.mock.calls.length).toBeGreaterThanOrEqual(4);
    expect(hooks.onParticleDeath).toHaveBeenCalledTimes(4);
    expect(hooks.onComplete).toHaveBeenCalledTimes(1);
  });

  it("lets onParticleUpdate steer particles", () => {
    const { konfeti, scheduler } = setup();
    const handle = konfeti.fire({
      particleCount: 3,
      onParticleUpdate: (particle) => {
        particle.x = 42;
      },
    }) as Burst;

    scheduler.step();
    expect(handle.getParticles().every((particle) => particle.x === 42)).toBe(true);
  });
});

describe("fire arrays", () => {
  it("returns one combined handle", async () => {
    const { konfeti, scheduler } = setup();
    const handle = konfeti.fire([
      { particleCount: 3, lifetime: 100 },
      { particleCount: 4, lifetime: 200 },
    ]);

    expect(handle.getParticleCount()).toBe(7);
    handle.pause();
    expect(handle.isPaused()).toBe(true);
    handle.resume();
    scheduler.step(30);
    expect(handle.isFinished()).toBe(true);
    await expect(handle).resolves.toBeUndefined();
  });
});

describe("floor", () => {
  it("keeps particles on screen until their lifetime ends", () => {
    const { konfeti, scheduler } = setup();
    const handle = konfeti.fire({
      particleCount: 10,
      lifetime: 20000,
      angle: 270,
      spread: 0,
      origin: { y: 0.9 },
      physics: { floor: true, gravity: 2000 },
    }) as Burst;
    const height = window.innerHeight;

    scheduler.step(300);
    expect(handle.getParticleCount()).toBe(10);
    expect(
      handle.getParticles().every((particle) => particle.y <= height && particle.isResting),
    ).toBe(true);
  });
});
