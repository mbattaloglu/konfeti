import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { WorkerPort } from "../../src/worker/WorkerPort";
import type { MainToWorker, WorkerToMain } from "../../src/worker/WorkerProtocol";
import { WorkerKonfetiInstance } from "../../src/worker/WorkerKonfetiInstance";
import { WorkerRuntime } from "../../src/worker/WorkerRuntime";
import { ManualScheduler } from "../helpers/ManualScheduler";

/**
 * In-Process Worker: a port that hands messages straight to a WorkerRuntime.
 */
type FakeWorker = {
  port: WorkerPort;
  sent: MainToWorker[];
  scheduler: ManualScheduler;
  tickStats: () => void;
  terminated: () => boolean;
};

/**
 * Create In-Process Worker.
 *
 * @returns Fake Worker
 */
function createFakeWorker(): FakeWorker {
  const scheduler = new ManualScheduler();
  const sent: MainToWorker[] = [];
  let statsCallback: () => void = () => undefined;
  let isTerminated = false;
  const port: WorkerPort = {
    onmessage: null,
    onerror: null,
    postMessage: (message) => {
      sent.push(message);
      runtime.handle(message);
    },
    terminate: () => {
      isTerminated = true;
    },
  };
  const runtime = new WorkerRuntime(
    (message: WorkerToMain) => {
      port.onmessage?.({ data: message });
    },
    scheduler,
    {
      setInterval: (callback) => {
        statsCallback = callback;
        return 1;
      },
      clearInterval: () => undefined,
    },
  );

  return {
    port,
    sent,
    scheduler,
    tickStats: () => {
      statsCallback();
    },
    terminated: () => isTerminated,
  };
}

/**
 * Create Canvas that Pretends to Support transferControlToOffscreen.
 *
 * @returns Canvas
 */
function transferableCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const offscreen = document.createElement("canvas");
  Object.assign(canvas, { transferControlToOffscreen: () => offscreen });
  document.body.append(canvas);
  return canvas;
}

beforeEach(() => {
  // only the presence of the constructors is checked; the port itself is faked
  vi.stubGlobal("OffscreenCanvas", Object);
  vi.stubGlobal("Worker", Object);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

/**
 * Flush Pending Promise Callbacks.
 */
async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("WorkerKonfetiInstance", () => {
  it("runs bursts in the worker and resolves handles", async () => {
    const fake = createFakeWorker();
    const stage = new WorkerKonfetiInstance(transferableCanvas(), { maxParticles: 50 }, () =>
      Promise.resolve(fake.port),
    );
    await flush();

    const handle = stage.fire({ particleCount: 8, lifetime: 100 });
    fake.tickStats();

    expect(stage.isWorker()).toBe(true);
    expect(fake.sent[0]?.type).toBe("init");
    expect(stage.getParticleCount()).toBe(8);
    expect(handle.getParticleCount()).toBe(8);

    fake.scheduler.step(20);
    await expect(handle).resolves.toBeUndefined();
    expect(handle.isFinished()).toBe(true);
    // the total drops with the completion message, not only with the next stats report
    expect(stage.getParticleCount()).toBe(0);
    stage.destroy();
    expect(fake.terminated()).toBe(true);
  });

  it("counts spawned, died and finished bursts from the worker", async () => {
    const fake = createFakeWorker();
    const stage = new WorkerKonfetiInstance(transferableCanvas(), {}, () =>
      Promise.resolve(fake.port),
    );
    await flush();

    const handle = stage.fire({ particleCount: 6, lifetime: 100 });
    fake.tickStats();
    expect(stage.getStats()).toEqual({ live: 6, spawned: 6, died: 0, completed: 0 });

    fake.scheduler.step(20);
    await handle;
    fake.tickStats();
    expect(stage.getStats()).toEqual({ live: 0, spawned: 6, died: 6, completed: 1 });
    stage.destroy();
  });

  it("counts the same stats in main-thread fallback mode", async () => {
    vi.stubGlobal("OffscreenCanvas", undefined);
    const stage = new WorkerKonfetiInstance(document.createElement("canvas"), {}, () =>
      Promise.reject(new Error("must not connect")),
    );

    const handle = stage.fire([{ particleCount: 2 }, { particleCount: 3 }]);
    expect(stage.getStats()).toEqual({ live: 5, spawned: 5, died: 0, completed: 0 });
    handle.stop();
    await handle;
    expect(stage.getStats().completed).toBe(2);
    stage.destroy();
  });

  it("pauses and resumes the worker", async () => {
    const fake = createFakeWorker();
    const stage = new WorkerKonfetiInstance(transferableCanvas(), {}, () =>
      Promise.resolve(fake.port),
    );
    await flush();

    const handle = stage.fire({ particleCount: 4, lifetime: 100 });
    stage.pause();
    expect(stage.isPaused()).toBe(true);
    expect(fake.scheduler.getPendingCount()).toBe(0);
    fake.scheduler.step(30);
    expect(handle.isFinished()).toBe(false);

    stage.resume();
    fake.scheduler.step(20);
    await expect(handle).resolves.toBeUndefined();
    expect(fake.sent.filter((message) => message.type === "pause")).toEqual([
      { type: "pause", paused: true },
      { type: "pause", paused: false },
    ]);
    stage.destroy();
  });

  it("streams from the worker, follows the pointer and ends gracefully", async () => {
    const fake = createFakeWorker();
    const canvas = transferableCanvas();
    const stage = new WorkerKonfetiInstance(canvas, {}, () => Promise.resolve(fake.port));
    await flush();

    const emitter = stage.emit({ rate: 120, lifetime: 100, follow: "pointer" });
    const emit = fake.sent.find((message) => message.type === "emit");
    expect(emit?.type === "emit" && emit.at).toBeNull();

    // the pointer arrives: the main thread sends its normalized position
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 0, clientY: 0 }));
    const move = fake.sent.find((message) => message.type === "move");
    expect(move?.type === "move" && move.at).toEqual({ x: 0.5, y: 0.5 });

    fake.scheduler.step(20);
    fake.tickStats();
    expect(stage.getStats().spawned).toBeGreaterThan(0);

    emitter.stop();
    expect(emitter.isEmitting()).toBe(false);
    expect(fake.sent.at(-1)).toMatchObject({ type: "control", action: "end" });
    fake.scheduler.step(20);
    await expect(emitter).resolves.toBeUndefined();
    stage.destroy();
  });

  it("emits in main-thread fallback mode too", () => {
    vi.stubGlobal("OffscreenCanvas", undefined);
    const stage = new WorkerKonfetiInstance(document.createElement("canvas"), {}, () =>
      Promise.reject(new Error("must not connect")),
    );

    const emitter = stage.emit({ rate: 30, follow: { x: 0.5, y: 0.5 } });

    expect(emitter.isEmitting()).toBe(true);
    emitter.clear();
    stage.destroy();
  });

  it("rejects an invalid rate", () => {
    const fake = createFakeWorker();
    const stage = new WorkerKonfetiInstance(transferableCanvas(), {}, () =>
      Promise.resolve(fake.port),
    );

    expect(() => stage.emit({ rate: -1 })).toThrow(/"rate" must be a positive number/);
    stage.destroy();
  });

  it("queues messages until the worker connects", async () => {
    const fake = createFakeWorker();
    let connect: (port: WorkerPort) => void = () => undefined;
    const stage = new WorkerKonfetiInstance(
      transferableCanvas(),
      {},
      () =>
        new Promise<WorkerPort>((resolve) => {
          connect = resolve;
        }),
    );

    stage.fire({ particleCount: 3 });
    expect(fake.sent).toHaveLength(0);

    connect(fake.port);
    await flush();
    expect(fake.sent.map((message) => message.type)).toEqual(["init", "fire"]);
    stage.destroy();
  });

  it("measures element and click origins on the main thread", async () => {
    const fake = createFakeWorker();
    // the built-in overlay canvas is created internally, so make every canvas transferable
    const transfer = vi
      .spyOn(HTMLCanvasElement.prototype, "transferControlToOffscreen")
      .mockImplementation(() => document.createElement("canvas") as unknown as OffscreenCanvas);
    const stage = new WorkerKonfetiInstance(null, {}, () => Promise.resolve(fake.port));
    transfer.mockRestore();
    await flush();

    stage.fire({ particleCount: 1, origin: { clientX: window.innerWidth / 2, clientY: 0 } });
    const fire = fake.sent.find((message) => message.type === "fire");

    expect(fire?.type === "fire" && fire.options.origin).toEqual({ x: 0.5, y: 0 });
    stage.destroy();
  });

  it("rejects options that cannot be sent to a worker", async () => {
    const fake = createFakeWorker();
    const stage = new WorkerKonfetiInstance(transferableCanvas(), {}, () =>
      Promise.resolve(fake.port),
    );
    await flush();

    expect(() => stage.fire({ onStart: () => undefined } as never)).toThrow(/cloneable/);
    stage.destroy();
  });

  it("rejects the handle when the worker reports invalid options", async () => {
    const fake = createFakeWorker();
    const stage = new WorkerKonfetiInstance(transferableCanvas(), {}, () =>
      Promise.resolve(fake.port),
    );
    await flush();

    await expect(stage.fire({ paper: { colors: "nope" as "red" } })).rejects.toThrow(
      /invalid color/,
    );
    stage.destroy();
  });

  it("fails every burst clearly when the worker cannot start", async () => {
    const fake = createFakeWorker();
    const canvas = document.createElement("canvas");
    // an offscreen canvas without a 2D context makes the worker's init fail
    Object.assign(canvas, {
      transferControlToOffscreen: () => ({ width: 0, height: 0, getContext: () => null }),
    });
    const stage = new WorkerKonfetiInstance(canvas, {}, () => Promise.resolve(fake.port));
    await flush();

    await expect(stage.fire()).rejects.toThrow(/2D context is not available/);
    await expect(stage.fire()).rejects.toThrow(/2D context is not available/);
    stage.destroy();
  });

  it("fails every burst when the worker script cannot load", async () => {
    const fake = createFakeWorker();
    const stage = new WorkerKonfetiInstance(transferableCanvas(), {}, () =>
      Promise.resolve(fake.port),
    );
    await flush();

    const pending = stage.fire({ particleCount: 3, lifetime: 100 });
    fake.port.onerror?.(new Event("error"));

    await expect(pending).rejects.toThrow(/worker script failed to load/);
    await expect(stage.fire()).rejects.toThrow(/worker script failed to load/);
    stage.destroy();
  });

  it("falls back to the main thread without OffscreenCanvas", () => {
    vi.stubGlobal("OffscreenCanvas", undefined);
    const stage = new WorkerKonfetiInstance(document.createElement("canvas"), {}, () =>
      Promise.reject(new Error("must not connect")),
    );

    expect(stage.isWorker()).toBe(false);
    expect(stage.fire({ particleCount: 4 }).getParticleCount()).toBe(4);
    stage.destroy();
  });
});
