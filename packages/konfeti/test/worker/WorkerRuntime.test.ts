import { describe, expect, it, vi } from "vitest";

import type { Burst } from "../../src/core/Burst";
import type { WorkerToMain } from "../../src/worker/WorkerProtocol";
import { WorkerRuntime } from "../../src/worker/WorkerRuntime";
import { ManualScheduler } from "../helpers/ManualScheduler";

/**
 * Create Runtime with Manual Frames and Timers.
 *
 * @returns Runtime, Scheduler, Received Messages and a Stats Tick
 */
function setup(): {
  runtime: WorkerRuntime;
  scheduler: ManualScheduler;
  messages: WorkerToMain[];
  tickStats: () => void;
} {
  const scheduler = new ManualScheduler();
  const messages: WorkerToMain[] = [];
  let statsCallback: () => void = () => undefined;
  const runtime = new WorkerRuntime((message) => messages.push(message), scheduler, {
    setInterval: (callback) => {
      statsCallback = callback;
      return 1;
    },
    clearInterval: () => undefined,
  });

  runtime.handle({
    type: "init",
    canvas: document.createElement("canvas") as unknown as OffscreenCanvas,
    width: 400,
    height: 300,
    pixelRatio: 2,
    settings: {
      maxParticles: 100,
      defaults: { particleCount: 5 },
      fixedTimestep: false,
      adaptiveQuality: false,
    },
  });

  return {
    runtime,
    scheduler,
    messages,
    tickStats: () => {
      statsCallback();
    },
  };
}

describe("WorkerRuntime", () => {
  it("fires bursts, reports stats and completion", () => {
    const { runtime, scheduler, messages, tickStats } = setup();

    runtime.handle({ type: "fire", id: 7, options: { lifetime: 100 } });
    tickStats();
    expect(messages).toContainEqual({
      type: "stats",
      total: 5,
      spawned: 5,
      died: 0,
      quality: 0,
      bursts: [[7, 5]],
    });

    scheduler.step(20);
    return Promise.resolve().then(() => {
      expect(messages).toContainEqual({ type: "complete", id: 7 });
    });
  });

  it("does not repeat identical stats", () => {
    const { runtime, messages, tickStats } = setup();

    runtime.handle({ type: "fire", id: 1, options: {} });
    tickStats();
    tickStats();
    expect(messages.filter((message) => message.type === "stats")).toHaveLength(1);
  });

  it("reports invalid options as errors", () => {
    const { runtime, messages } = setup();

    runtime.handle({ type: "fire", id: 3, options: { paper: { colors: "not-a-color" as "red" } } });
    expect(messages).toContainEqual(expect.objectContaining({ type: "error", id: 3 }));
  });

  it("stops bursts on request", async () => {
    const { runtime, scheduler, messages } = setup();

    runtime.handle({ type: "fire", id: 2, options: { lifetime: 10000 } });
    runtime.handle({ type: "control", id: 2, action: "stop" });
    scheduler.step();
    await Promise.resolve();
    expect(messages).toContainEqual({ type: "complete", id: 2 });
  });

  it("pulls toward the attractor target only once the main thread places it", () => {
    const { runtime, scheduler } = setup();
    runtime.handle({
      type: "fire",
      id: 4,
      options: {
        startVelocity: 0,
        lifetime: 60_000,
        origin: { x: 0.5, y: 0.8 },
        physics: { gravity: 0, drag: 0, wind: 0, attract: { target: "pointer", strength: 3000 } },
      },
    });
    // the runtime keeps bursts private; read the one just fired to see where its particles are
    const burst = (runtime as unknown as { bursts: Map<number, Burst> }).bursts.get(4);
    const meanY = (): number => {
      const particles = burst?.getParticles() ?? [];
      return particles.reduce((sum, particle) => sum + particle.y, 0) / particles.length;
    };
    const start = meanY();

    // the worker cannot see the pointer: nothing pulls before the first "attract" message
    scheduler.step(5);
    expect(meanY()).toBeCloseTo(start, 5);

    runtime.handle({ type: "attract", id: 4, at: { x: 0.5, y: 0 } });
    scheduler.step(5);
    expect(meanY()).toBeLessThan(start - 1);

    runtime.handle({ type: "attract", id: 4, at: null });
    const hidden = meanY();
    scheduler.step(5);
    // drag is off, so the speed gained so far carries on, but no longer grows
    expect(hidden - meanY()).toBeLessThan((start - hidden) * 2);
  });

  it("forms a shape inside the worker", () => {
    // the canvas mock reads back empty pixels: make every pixel of the text opaque
    const read = vi.spyOn(CanvasRenderingContext2D.prototype, "getImageData").mockImplementation(
      (_x: number, _y: number, width: number, height: number) =>
        ({
          width,
          height,
          data: new Uint8ClampedArray(width * height * 4).fill(255),
        }) as ImageData,
    );
    const { runtime } = setup();

    runtime.handle({ type: "fire", id: 6, options: { formation: { text: "A", mode: "appear" } } });
    const burst = (runtime as unknown as { bursts: Map<number, Burst> }).bursts.get(6);

    expect(burst?.getParticleCount()).toBeGreaterThan(0);
    expect(burst?.getParticles().every((particle) => particle.isForming)).toBe(true);
    read.mockRestore();
  });

  it("errors before init", () => {
    const messages: WorkerToMain[] = [];
    const runtime = new WorkerRuntime((message) => messages.push(message), new ManualScheduler());

    runtime.handle({ type: "fire", id: 9, options: {} });
    expect(messages).toEqual([
      { type: "error", id: 9, message: "konfeti: worker is not initialized" },
    ]);
  });
});
