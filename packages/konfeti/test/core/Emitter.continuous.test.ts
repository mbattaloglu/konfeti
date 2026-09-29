import { afterEach, describe, expect, it, vi } from "vitest";

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
  const konfeti = new KonfetiInstance(null, { frameScheduler: scheduler, maxParticles: 5000 });
  instances.push(konfeti);
  return { konfeti, scheduler };
}

afterEach(() => {
  for (const instance of instances.splice(0)) {
    instance.destroy();
  }
  vi.restoreAllMocks();
});

describe("continuous emitter", () => {
  it("emits `rate` particles per second until stopped, then finishes", async () => {
    const { konfeti, scheduler } = setup();
    let spawned = 0;
    const emitter = konfeti.emit({
      rate: 60,
      lifetime: 200,
      onParticleSpawn: () => {
        spawned++;
      },
    });

    // one second at 60 fps
    scheduler.step(60);
    expect(spawned).toBeGreaterThanOrEqual(58);
    expect(spawned).toBeLessThanOrEqual(60);
    expect(emitter.isEmitting()).toBe(true);

    emitter.stop();
    const atStop = spawned;
    expect(emitter.isEmitting()).toBe(false);
    scheduler.step(30);
    expect(spawned).toBe(atStop);
    await expect(emitter).resolves.toBeUndefined();
    expect(emitter.isFinished()).toBe(true);
  });

  it("follows the pointer and emits nothing before it moves", () => {
    const { konfeti, scheduler } = setup();
    const emitter = konfeti.emit({
      rate: 120,
      lifetime: 1000,
      startVelocity: 0,
      follow: "pointer",
    });

    scheduler.step(10);
    expect(emitter.getParticleCount()).toBe(0);

    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 40, clientY: 25 }));
    scheduler.step(10);
    expect(emitter.getParticleCount()).toBeGreaterThan(0);
    emitter.clear();
  });

  it("moveTo() changes the target, clear() removes everything at once", async () => {
    const { konfeti, scheduler } = setup();
    const emitter = konfeti.emit({ rate: 120, lifetime: 5000, follow: "pointer" });
    emitter.moveTo({ x: 0.5, y: 0.5 });
    scheduler.step(10);
    expect(emitter.getParticleCount()).toBeGreaterThan(0);

    emitter.clear();
    scheduler.step(1);
    await expect(emitter).resolves.toBeUndefined();
    expect(emitter.getParticleCount()).toBe(0);
  });

  it("removes its pointer listeners when it finishes", async () => {
    const { konfeti, scheduler } = setup();
    const remove = vi.spyOn(window, "removeEventListener");
    const emitter = konfeti.emit({ rate: 30, follow: "pointer" });

    emitter.clear();
    scheduler.step(1);
    await emitter;

    const removed = remove.mock.calls.map(([type]) => type);
    expect(removed).toEqual(expect.arrayContaining(["pointermove", "pointerdown"]));
  });

  it("pauses with the handle", () => {
    const { konfeti, scheduler } = setup();
    let spawned = 0;
    const emitter = konfeti.emit({
      rate: 60,
      onParticleSpawn: () => {
        spawned++;
      },
    });
    scheduler.step(10);
    emitter.pause();
    const atPause = spawned;
    scheduler.step(30);

    expect(spawned).toBe(atPause);
    expect(emitter.isPaused()).toBe(true);
    emitter.clear();
  });

  it("rejects a missing or invalid rate", () => {
    const { konfeti } = setup();

    expect(() => konfeti.emit({ rate: 0 })).toThrow(/"rate" must be a positive number/);
    expect(() => konfeti.emit({ rate: Number.NaN })).toThrow(TypeError);
  });
});
