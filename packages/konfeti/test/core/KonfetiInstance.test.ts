import { afterEach, describe, expect, it } from "vitest";

import type { Burst } from "../../src/core/Burst";
import { KonfetiInstance } from "../../src/core/KonfetiInstance";
import { ManualScheduler } from "../helpers/ManualScheduler";

const instances: KonfetiInstance[] = [];

/**
 * Create Test Instance with Manual Scheduler.
 *
 * @param maxParticles - Maximum Live Particles
 * @returns Instance and Scheduler
 */
function setup(maxParticles = 1500): { konfeti: KonfetiInstance; scheduler: ManualScheduler } {
  const scheduler = new ManualScheduler();
  const konfeti = new KonfetiInstance(null, { frameScheduler: scheduler, maxParticles });
  instances.push(konfeti);
  return { konfeti, scheduler };
}

afterEach(() => {
  for (const instance of instances.splice(0)) {
    instance.destroy();
  }
});

describe("KonfetiInstance", () => {
  it("mounts an overlay canvas lazily on first fire", () => {
    const { konfeti } = setup();

    expect(konfeti.getCanvas().isConnected).toBe(false);
    konfeti.fire({ particleCount: 5 });
    expect(konfeti.getCanvas().isConnected).toBe(true);
    expect(konfeti.getParticleCount()).toBe(5);
  });

  it("animates until every particle expires, then resolves and idles", async () => {
    const { konfeti, scheduler } = setup();
    const handle = konfeti.fire({ particleCount: 20, lifetime: 500 });

    scheduler.step(10);
    expect(konfeti.getParticleCount()).toBe(20);

    scheduler.step(40);
    expect(konfeti.getParticleCount()).toBe(0);
    expect(handle.isFinished()).toBe(true);
    expect(scheduler.getPendingCount()).toBe(0);
    await expect(handle).resolves.toBeUndefined();
  });

  it("pauses without aging and resumes", () => {
    const { konfeti, scheduler } = setup();
    const handle = konfeti.fire({ particleCount: 3, lifetime: 200 });

    handle.pause();
    scheduler.step(60);
    expect(handle.isFinished()).toBe(false);
    expect(scheduler.getPendingCount()).toBe(0);

    handle.resume();
    scheduler.step(30);
    expect(handle.isFinished()).toBe(true);
  });

  it("stops a burst immediately", () => {
    const { konfeti, scheduler } = setup();
    const handle = konfeti.fire({ particleCount: 10 });

    handle.stop();
    scheduler.step();
    expect(handle.isFinished()).toBe(true);
    expect(konfeti.getParticleCount()).toBe(0);
  });

  it("evicts the oldest particles when maxParticles is exceeded", () => {
    const { konfeti } = setup(30);
    const first = konfeti.fire({ particleCount: 20 });
    const second = konfeti.fire({ particleCount: 20 });

    expect(konfeti.getParticleCount()).toBe(30);
    expect(first.getParticleCount()).toBe(10);
    expect(second.getParticleCount()).toBe(20);
  });

  it("reuses pooled particles across bursts", () => {
    const { konfeti, scheduler } = setup();
    const firstParticles = new Set(
      (konfeti.fire({ particleCount: 10, lifetime: 100 }) as Burst).getParticles(),
    );

    scheduler.step(20);
    const secondParticles = (konfeti.fire({ particleCount: 10 }) as Burst).getParticles();

    expect(secondParticles.every((particle) => firstParticles.has(particle))).toBe(true);
  });

  it("produces identical bursts for identical seeds", () => {
    const snapshot = (): number[] => {
      const { konfeti } = setup();
      const burst = konfeti.fire({ particleCount: 5, seed: 1234 }) as Burst;
      return burst
        .getParticles()
        .flatMap((p) => [p.x, p.y, p.vx, p.vy, p.width, p.height, p.rotation]);
    };

    expect(snapshot()).toEqual(snapshot());
  });

  it("merges instance defaults under fire options", () => {
    const scheduler = new ManualScheduler();
    const konfeti = new KonfetiInstance(null, {
      frameScheduler: scheduler,
      defaults: { particleCount: 7, paper: { colors: "red", form: "square" } },
    });
    instances.push(konfeti);

    const burst = konfeti.fire({ paper: { width: 10 } }) as Burst;
    const particle = burst.getParticles()[0];

    expect(burst.getParticleCount()).toBe(7);
    expect(particle?.frontColor).toBe("rgb(255,0,0)");
    expect(particle?.height).toBe(particle?.width);
  });

  it("draws to the canvas while animating", () => {
    const { konfeti, scheduler } = setup();
    konfeti.fire({ particleCount: 4, paper: { cornerRadius: 2, stroke: { color: "white" } } });
    scheduler.step();

    const context = konfeti.getCanvas().getContext("2d");
    // vitest-canvas-mock records draw calls
    const calls = (context as unknown as { __getDrawCalls(): unknown[] }).__getDrawCalls();
    expect(calls.length).toBeGreaterThan(0);
  });

  it("refuses to fire after destroy and removes the overlay", () => {
    const { konfeti } = setup();
    konfeti.fire({ particleCount: 1 });
    konfeti.destroy();

    expect(konfeti.getCanvas().isConnected).toBe(false);
    expect(() => konfeti.fire()).toThrow(/destroyed/);
  });
});
