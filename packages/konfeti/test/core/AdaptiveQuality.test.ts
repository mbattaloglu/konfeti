import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { KonfetiInstance } from "../../src/core/KonfetiInstance";
import type { CreateOptions } from "../../src/types/CreateOptions";
import { ManualScheduler } from "../helpers/ManualScheduler";

const instances: KonfetiInstance[] = [];

/**
 * Create Test Instance with Manual Scheduler.
 *
 * @param options - Instance Options
 * @returns Instance and Scheduler
 */
function setup(options: CreateOptions): { konfeti: KonfetiInstance; scheduler: ManualScheduler } {
  const scheduler = new ManualScheduler();
  const konfeti = new KonfetiInstance(null, { frameScheduler: scheduler, ...options });
  instances.push(konfeti);
  return { konfeti, scheduler };
}

/**
 * Play Slow Frames (25 fps) in which konfeti Itself Takes 20 ms.
 *
 * @param scheduler - Manual Scheduler
 * @param seconds - Duration
 */
function playSlowFrames(scheduler: ManualScheduler, seconds: number): void {
  // the engine reads the clock before and after its work: report 20 ms in between
  let reads = 0;
  const clock = vi.spyOn(performance, "now").mockImplementation(() => (reads++ % 2) * 20);
  scheduler.step(Math.ceil((seconds * 1000) / 40), 40);
  clock.mockRestore();
}

beforeEach(() => {
  Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: 2 });
});

afterEach(() => {
  for (const instance of instances.splice(0)) {
    instance.destroy();
  }
  Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: 1 });
  vi.restoreAllMocks();
});

describe("adaptive quality", () => {
  it("steps down on a slow device: CSS resolution first, fewer particles last", () => {
    const { konfeti, scheduler } = setup({ adaptiveQuality: true });
    konfeti.fire({ particleCount: 50, lifetime: 60_000 });
    const fullWidth = konfeti.getCanvas().width;

    playSlowFrames(scheduler, 1);
    expect(konfeti.getQualityLevel()).toBe(1);
    expect(konfeti.getCanvas().width).toBe(fullWidth / 2);

    playSlowFrames(scheduler, 1.1);
    expect(konfeti.getQualityLevel()).toBe(3);
    expect(konfeti.fire({ particleCount: 100 }).getParticleCount()).toBe(60);
  });

  it("stops at level 2 with fixedTimestep, so replays spawn the same particles", () => {
    const { konfeti, scheduler } = setup({ adaptiveQuality: true, fixedTimestep: true });
    konfeti.fire({ particleCount: 50, lifetime: 60_000 });

    playSlowFrames(scheduler, 3);
    expect(konfeti.getQualityLevel()).toBe(2);
    expect(konfeti.fire({ particleCount: 100 }).getParticleCount()).toBe(100);
  });

  it("keeps full quality without the option", () => {
    const { konfeti, scheduler } = setup({});
    konfeti.fire({ particleCount: 50, lifetime: 60_000 });
    const fullWidth = konfeti.getCanvas().width;

    playSlowFrames(scheduler, 3);
    expect(konfeti.getQualityLevel()).toBe(0);
    expect(konfeti.getCanvas().width).toBe(fullWidth);
  });
});
