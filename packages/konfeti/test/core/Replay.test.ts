import { afterEach, describe, expect, it } from "vitest";

import type { Burst } from "../../src/core/Burst";
import { KonfetiInstance } from "../../src/core/KonfetiInstance";
import type { FireOptions } from "../../src/types/FireOptions";
import { ManualScheduler } from "../helpers/ManualScheduler";

const instances: KonfetiInstance[] = [];

/**
 * Create Test Instance with Manual Scheduler.
 *
 * @param fixedTimestep - Simulate in Fixed Steps Flag
 * @returns Instance and Scheduler
 */
function setup(fixedTimestep = false): { konfeti: KonfetiInstance; scheduler: ManualScheduler } {
  const scheduler = new ManualScheduler();
  const konfeti = new KonfetiInstance(null, { frameScheduler: scheduler, fixedTimestep });
  instances.push(konfeti);
  return { konfeti, scheduler };
}

/**
 * Record Where Every Particle of a Burst Is and How It Turns.
 *
 * @param burst - Burst
 * @returns Positions and Rotations
 */
function snapshot(burst: Burst): number[][] {
  return burst.getParticles().map((particle) => [particle.x, particle.y, particle.rotation]);
}

/**
 * Burst Used for Replays: a long life, so every particle is still there after half a second.
 */
const BURST: FireOptions = { particleCount: 40, lifetime: 10_000, spread: 120 };

/**
 * Fire a Burst and Let Half a Second Pass at a Given Frame Rhythm.
 *
 * @param fixedTimestep - Simulate in Fixed Steps Flag
 * @param frames - Frame Durations in Milliseconds, Played in Order
 * @returns Snapshot after the Frames
 */
function play(fixedTimestep: boolean, frames: readonly number[]): number[][] {
  const { konfeti, scheduler } = setup(fixedTimestep);
  const burst = konfeti.fire({ ...BURST, seed: 1234 }) as Burst;

  for (const frameMs of frames) {
    scheduler.step(1, frameMs);
  }

  return snapshot(burst);
}

afterEach(() => {
  for (const instance of instances.splice(0)) {
    instance.destroy();
  }
});

describe("replays", () => {
  it("reports the seed of a burst, given or picked", () => {
    const { konfeti } = setup();

    expect(konfeti.fire({ seed: 42 }).getSeed()).toBe(42);
    expect(Number.isInteger(konfeti.fire().getSeed())).toBe(true);
  });

  it("fires the same particles again with the reported seed", () => {
    const { konfeti } = setup();
    const first = konfeti.fire(BURST) as Burst;
    const again = konfeti.fire({ ...BURST, seed: first.getSeed() }) as Burst;
    const launch = (burst: Burst): unknown[][] =>
      burst
        .getParticles()
        .map((particle) => [particle.vx, particle.vy, particle.frontColor, particle.width]);

    expect(launch(again)).toEqual(launch(first));
  });

  it("reports the first burst's seed for a list", () => {
    const { konfeti } = setup();

    expect(konfeti.fire([{ seed: 7 }, { seed: 8 }]).getSeed()).toBe(7);
  });

  it("with fixedTimestep, replays exactly at any frame rate", () => {
    const at60 = play(
      true,
      Array.from({ length: 30 }, () => 1000 / 60),
    );
    const at120 = play(
      true,
      Array.from({ length: 59 }, () => 1000 / 120),
    );
    const jittery = play(
      true,
      Array.from({ length: 30 }, (_, index) => (index % 2 === 0 ? 15 : 18.333)),
    );

    expect(at120).toEqual(at60);
    expect(jittery).toEqual(at60);
  });

  it("without it, the paths follow the frame timing", () => {
    const at60 = play(
      false,
      Array.from({ length: 30 }, () => 1000 / 60),
    );
    const at120 = play(
      false,
      Array.from({ length: 59 }, () => 1000 / 120),
    );

    // the same particles, but integrated in different steps
    expect(at120).not.toEqual(at60);
  });
});
