import type { BurstHooks } from "../BurstHooks";
import type { FireOptions } from "../FireOptions";
import type { BuiltinPhysicsOptions } from "../PhysicsOptions";
import type { BuiltinShapeOptions } from "../shapes/ShapeOptions";
import type { Cloneable } from "./Cloneable";

/**
 * Burst Options for a Worker Instance.
 * `FireOptions` minus what cannot run inside a worker: hooks, function-valued options (custom easings),
 * `Path2D` paths, DOM image elements, shapes from `defineShape()` and modules from `definePhysics()`.
 * Use named easings, SVG path strings and image URLs or `ImageBitmap`s instead.
 *
 * @example
 * ```ts
 * const stage = KonfetiFactory.createWorker(canvas);
 * stage.fire({ particleCount: 200, paper: { fadeOut: { easing: "easeInQuad" } } });
 * ```
 */
export type WorkerFireOptions = Cloneable<
  Omit<FireOptions, keyof BurstHooks | "shapes" | "physics">
> & {
  /**
   * Shape Mix (built-in shapes only).
   *
   * @defaultValue `[{ type: "paper" }]`
   */
  readonly shapes?: readonly Cloneable<BuiltinShapeOptions>[];
  /**
   * Motion Physics (built-in modules only).
   */
  readonly physics?: Cloneable<BuiltinPhysicsOptions>;
};
