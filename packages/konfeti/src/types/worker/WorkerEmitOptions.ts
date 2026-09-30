import type { EmitterTarget } from "../EmitterTarget";
import type { WorkerFireOptions } from "./WorkerFireOptions";

/**
 * Worker-Safe Continuous Emitter Options.
 * The worker version of `EmitOptions`: every worker-safe fire setting plus `rate` and `follow`. What the
 * emitter follows is measured on the main thread and sent to the worker.
 *
 * @example
 * ```ts
 * const stage = createWorker(canvas);
 * const trail = stage.emit({ rate: 80, follow: "pointer", spread: 360 });
 * ```
 */
export type WorkerEmitOptions = Omit<
  WorkerFireOptions,
  "particleCount" | "origin" | "emission" | "formation"
> & {
  /**
   * Emission Rate.
   * Particles per second; must be a positive, finite number.
   *
   * @remarks Unit: particles per second.
   */
  readonly rate: number;
  /**
   * Emission Point: an element, `"pointer"` or a normalized point.
   *
   * @defaultValue `{ x: 0.5, y: 0.6 }`
   */
  readonly follow?: EmitterTarget;
};
