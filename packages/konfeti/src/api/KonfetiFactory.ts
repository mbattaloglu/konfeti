import { KonfetiInstance } from "../core/KonfetiInstance";
import type { CreateOptions } from "../types/CreateOptions";

/**
 * Konfeti Instance Factory.
 * Create dedicated instances for your own canvas, separate defaults or particle budgets. The everyday
 * fullscreen API is the shared `Konfeti` object; worker instances come from `createWorker` in `konfeti/worker`.
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
}
