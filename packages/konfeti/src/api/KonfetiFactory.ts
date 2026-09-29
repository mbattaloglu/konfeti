import { KonfetiInstance } from "../core/KonfetiInstance";
import type { CreateOptions } from "../types/CreateOptions";
import type { WorkerCreateOptions } from "../types/worker/WorkerCreateOptions";
import { WorkerKonfetiInstance } from "../worker/WorkerKonfetiInstance";

/**
 * Konfeti Instance Factory.
 * Create dedicated instances for your own canvas, separate defaults or particle budgets. The everyday
 * fullscreen API is the shared `Konfeti` object.
 */
export class KonfetiFactory {
  /**
   * Create Instance.
   *
   * @param canvas - Target Canvas (`null` or omitted creates a fullscreen overlay on first `fire()`)
   * @param options - Instance Options
   * @returns Konfeti Instance
   * @example
   * ```ts
   * const stage = KonfetiFactory.create(document.querySelector("#stage"), {
   *   maxParticles: 800,
   *   defaults: { paper: { form: "circle" } },
   * });
   * stage.fire({ particleCount: 80 });
   * stage.destroy();
   * ```
   */
  public static create(
    canvas?: HTMLCanvasElement | null,
    options?: CreateOptions,
  ): KonfetiInstance {
    return new KonfetiInstance(canvas ?? null, options);
  }

  /**
   * Create Worker Instance.
   * Simulation and drawing move to a Web Worker (the canvas becomes an `OffscreenCanvas`), so confetti stays
   * smooth while the page is busy. Falls back to the main thread when `OffscreenCanvas` is unsupported.
   * Options must be worker-safe: no hooks, easing functions, `Path2D`, DOM images or `defineShape`/`definePhysics`
   * extensions (see `WorkerFireOptions`).
   *
   * @param canvas - Target Canvas (`null` or omitted creates a fullscreen overlay)
   * @param options - Worker Instance Options
   * @returns Worker Instance
   * @example
   * ```ts
   * const stage = KonfetiFactory.createWorker(document.querySelector("canvas"));
   * stage.fire({ particleCount: 400, spread: 360 });
   * stage.isWorker(); // true where OffscreenCanvas is supported
   * ```
   */
  public static createWorker(
    canvas?: HTMLCanvasElement | null,
    options?: WorkerCreateOptions,
  ): WorkerKonfetiInstance {
    return new WorkerKonfetiInstance(canvas ?? null, options);
  }
}
