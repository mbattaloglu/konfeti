import { afterEach, describe, expect, it } from "vitest";

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

/**
 * Let Time Pass in 20 ms Frames.
 *
 * @param scheduler - Manual Scheduler
 * @param ms - Duration in Milliseconds
 */
function wait(scheduler: ManualScheduler, ms: number): void {
  scheduler.step(Math.round(ms / 20), 20);
}

afterEach(() => {
  for (const instance of instances.splice(0)) {
    instance.destroy();
  }
});

describe("delay", () => {
  it("starts a burst once its delay has passed", () => {
    const { konfeti, scheduler } = setup();
    const burst = konfeti.fire({ particleCount: 10, lifetime: 5000, delay: 500 });

    wait(scheduler, 460);
    expect(burst.getParticleCount()).toBe(0);
    expect(burst.isFinished()).toBe(false);
    wait(scheduler, 60);
    expect(burst.getParticleCount()).toBe(10);
  });

  it("choreographs the entries of a list", () => {
    const { konfeti, scheduler } = setup();
    const group = konfeti.fire([
      { particleCount: 5, lifetime: 5000 },
      { particleCount: 7, lifetime: 5000, delay: 300 },
    ]);

    expect(group.getParticleCount()).toBe(5);
    wait(scheduler, 320);
    expect(group.getParticleCount()).toBe(12);
  });

  it("shifts a stream's schedule by the delay", () => {
    const { konfeti, scheduler } = setup();
    const burst = konfeti.fire({
      particleCount: 60,
      lifetime: 5000,
      delay: 200,
      emission: { mode: "stream", duration: 1000 },
    }) as Burst;

    wait(scheduler, 180);
    expect(burst.getParticleCount()).toBe(0);
    // half of the stream's second after the delay
    wait(scheduler, 520);
    expect(burst.getParticleCount()).toBeGreaterThanOrEqual(29);
    expect(burst.getParticleCount()).toBeLessThanOrEqual(32);
  });

  it("does not count paused time", () => {
    const { konfeti, scheduler } = setup();
    const burst = konfeti.fire({ particleCount: 4, lifetime: 5000, delay: 300 });

    burst.pause();
    wait(scheduler, 600);
    expect(burst.getParticleCount()).toBe(0);
    burst.resume();
    wait(scheduler, 340);
    expect(burst.getParticleCount()).toBe(4);
  });

  it("rejects a negative delay", () => {
    const { konfeti } = setup();

    expect(() => konfeti.fire({ delay: -1 })).toThrow(/"delay" must be zero or more/);
  });
});
