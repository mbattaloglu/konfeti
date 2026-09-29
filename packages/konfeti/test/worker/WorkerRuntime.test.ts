import { describe, expect, it } from "vitest";

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
    settings: { maxParticles: 100, defaults: { particleCount: 5 } },
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
    expect(messages).toContainEqual({ type: "stats", total: 5, bursts: [[7, 5]] });

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

  it("errors before init", () => {
    const messages: WorkerToMain[] = [];
    const runtime = new WorkerRuntime((message) => messages.push(message), new ManualScheduler());

    runtime.handle({ type: "fire", id: 9, options: {} });
    expect(messages).toEqual([
      { type: "error", id: 9, message: "konfeti: worker is not initialized" },
    ]);
  });
});
