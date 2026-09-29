import { Burst } from "../core/Burst";
import { Engine } from "../core/Engine";
import { ParticlePool } from "../core/ParticlePool";
import { OptionResolver } from "../core/resolve/OptionResolver";
import { Canvas2DRenderer } from "../renderers/Canvas2DRenderer";
import type { FrameScheduler } from "../types/FrameScheduler";
import type { FireOptions } from "../types/FireOptions";
import type { WorkerFireOptions } from "../types/worker/WorkerFireOptions";
import type { OffscreenCanvasLike } from "./OffscreenSurface";
import { OffscreenSurface } from "./OffscreenSurface";
import type { MainToWorker, WorkerRuntimeSettings, WorkerToMain } from "./WorkerProtocol";

/**
 * Interval Timer Functions (injectable for tests).
 */
export type IntervalTimers = {
  /**
   * Start Interval.
   */
  readonly setInterval: (callback: () => void, ms: number) => number;
  /**
   * Stop Interval.
   */
  readonly clearInterval: (id: number) => void;
};

/**
 * Worker-Side Konfeti Runtime.
 * Owns the engine that draws into the transferred `OffscreenCanvas` and answers the main thread's messages.
 * Independent of the worker global so it can run in-process in tests.
 */
export class WorkerRuntime {
  /**
   * Stats Report Interval.
   */
  private static readonly STATS_INTERVAL_MS = 200;

  /**
   * Fallback Frame Interval (≈60 fps).
   */
  private static readonly FALLBACK_FRAME_MS = 16;

  /**
   * Live Bursts by Main-Thread Id.
   */
  private readonly bursts = new Map<number, Burst>();

  /**
   * Message Sender.
   */
  private readonly post: (message: WorkerToMain) => void;

  /**
   * Frame Scheduler.
   */
  private readonly scheduler: FrameScheduler;

  /**
   * Interval Timers.
   */
  private readonly timers: IntervalTimers;

  /**
   * Drawing Surface (after init).
   */
  private surface: OffscreenSurface | null = null;

  /**
   * Engine (after init).
   */
  private engine: Engine | null = null;

  /**
   * Instance Default Burst Options.
   */
  private defaults: WorkerFireOptions = {};

  /**
   * Stats Interval Id.
   */
  private statsTimer: number | null = null;

  /**
   * Last Reported Stats Key (skips identical reports).
   */
  private lastStats = "";

  /**
   * Particles Spawned So Far (hooks cannot reach the main thread, so the worker counts).
   */
  private spawned = 0;

  /**
   * Particles Died So Far.
   */
  private died = 0;

  /**
   * Internal Counting Hooks, Added as the Last Option Layer of Every Burst.
   * Users cannot send hooks to a worker, so these never replace a user hook.
   */
  private readonly countingHooks: FireOptions = {
    onParticleSpawn: () => {
      this.spawned++;
    },
    onParticleDeath: () => {
      this.died++;
    },
  };

  /**
   * Create Runtime.
   *
   * @param post - Message Sender
   * @param scheduler - Frame Scheduler
   * @param timers - Interval Timers
   */
  public constructor(
    post: (message: WorkerToMain) => void,
    scheduler: FrameScheduler,
    timers: IntervalTimers = {
      setInterval: (callback, ms) => setInterval(callback, ms) as unknown as number,
      clearInterval: (id) => {
        clearInterval(id);
      },
    },
  ) {
    this.post = post;
    this.scheduler = scheduler;
    this.timers = timers;
  }

  /**
   * Create Frame Scheduler for a Worker Scope.
   * Dedicated workers have `requestAnimationFrame` in modern browsers; older ones fall back to a timer.
   *
   * @param scope - Worker Global Scope
   * @returns Frame Scheduler
   */
  public static createScheduler(
    scope: Partial<Pick<Window, "requestAnimationFrame" | "cancelAnimationFrame">>,
  ): FrameScheduler {
    const request = scope.requestAnimationFrame?.bind(scope);
    const cancel = scope.cancelAnimationFrame?.bind(scope);

    if (request !== undefined && cancel !== undefined) {
      return { request, cancel };
    }

    return {
      request: (callback) =>
        setTimeout(() => {
          callback(performance.now());
        }, WorkerRuntime.FALLBACK_FRAME_MS) as unknown as number,
      cancel: (id) => {
        clearTimeout(id);
      },
    };
  }

  /**
   * Handle Message from the Main Thread.
   *
   * @param message - Protocol Message
   */
  public handle(message: MainToWorker): void {
    switch (message.type) {
      case "init":
        this.init(
          message.canvas,
          message.width,
          message.height,
          message.pixelRatio,
          message.settings,
        );
        break;
      case "fire":
        this.fire(message.id, message.options);
        break;
      case "control":
        this.control(message.id, message.action);
        break;
      case "reset":
        this.engine?.clear();
        break;
      case "resize":
        this.surface?.resize(message.width, message.height, message.pixelRatio);
        break;
      case "pause":
        if (message.paused) {
          this.engine?.pause();
        } else {
          this.engine?.resume();
        }
        break;
      case "visibility":
        if (message.hidden) {
          this.engine?.suspend();
        } else {
          this.engine?.unsuspend();
        }
        break;
      case "destroy":
        this.destroy();
        break;
    }
  }

  /**
   * Initialize Surface and Engine.
   *
   * @param canvas - Transferred Offscreen Canvas
   * @param width - CSS Width
   * @param height - CSS Height
   * @param pixelRatio - Canvas Pixels per CSS Pixel
   * @param settings - Runtime Settings
   */
  private init(
    canvas: OffscreenCanvasLike,
    width: number,
    height: number,
    pixelRatio: number,
    settings: WorkerRuntimeSettings,
  ): void {
    this.surface = new OffscreenSurface(canvas);
    this.surface.resize(width, height, pixelRatio);
    this.defaults = settings.defaults;
    this.engine = new Engine(
      this.surface,
      new Canvas2DRenderer(),
      this.scheduler,
      new ParticlePool(),
      settings.maxParticles,
    );
    this.statsTimer = this.timers.setInterval(this.reportStats, WorkerRuntime.STATS_INTERVAL_MS);
  }

  /**
   * Fire Burst.
   *
   * @param id - Main-Thread Burst Id
   * @param options - Worker-Safe Burst Options
   */
  private fire(id: number, options: WorkerFireOptions): void {
    const engine = this.engine;
    const surface = this.surface;

    if (engine === null || surface === null) {
      this.post({ type: "error", id, message: "konfeti: worker is not initialized" });
      return;
    }

    try {
      const resolved = OptionResolver.resolveFire([this.defaults, options, this.countingHooks], {
        pixelRatio: surface.getPixelRatio(),
      });
      const burst = new Burst(resolved, engine);
      this.bursts.set(id, burst);
      engine.add(burst);
      void burst.then(() => {
        this.bursts.delete(id);
        this.post({ type: "complete", id });
      });
    } catch (error) {
      this.post({
        type: "error",
        id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Pause, Resume or Stop Burst.
   *
   * @param id - Main-Thread Burst Id
   * @param action - Control Action
   */
  private control(id: number, action: "pause" | "resume" | "stop"): void {
    const burst = this.bursts.get(id);

    switch (action) {
      case "pause":
        burst?.pause();
        break;
      case "resume":
        burst?.resume();
        break;
      case "stop":
        burst?.stop();
        break;
    }
  }

  /**
   * Report Live Particle Counts (only when they changed).
   */
  private readonly reportStats = (): void => {
    const bursts: (readonly [number, number])[] = [];
    let total = 0;

    for (const [id, burst] of this.bursts) {
      const count = burst.getParticleCount();
      total += count;
      bursts.push([id, count]);
    }

    const key = `${String(total)}:${String(this.spawned)}:${String(this.died)}:${bursts.map(([id, count]) => `${String(id)}=${String(count)}`).join(",")}`;

    if (key !== this.lastStats) {
      this.lastStats = key;
      this.post({ type: "stats", total, spawned: this.spawned, died: this.died, bursts });
    }
  };

  /**
   * Stop Everything.
   */
  private destroy(): void {
    this.engine?.clear();

    if (this.statsTimer !== null) {
      this.timers.clearInterval(this.statsTimer);
      this.statsTimer = null;
    }

    this.bursts.clear();
  }
}
