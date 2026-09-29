import type { EmitterTarget } from "./EmitterTarget";
import type { FireOptions } from "./FireOptions";

/**
 * Continuous Emitter Options.
 * Everything `fire()` accepts (shapes, paper, physics, hooks …) except the settings a stream replaces:
 * `particleCount` becomes `rate`, `origin` becomes `follow`, and `emission` is always continuous.
 *
 * @example
 * ```ts
 * const trail = Konfeti.emit({
 *   rate: 40,
 *   follow: "pointer",
 *   spread: 360,
 *   startVelocity: [50, 150],
 *   shapes: [{ type: "star", size: [8, 12] }],
 * });
 * trail.stop(); // stop emitting; the particles already out finish their lives
 * ```
 */
export type EmitOptions = Omit<FireOptions, "particleCount" | "origin" | "emission"> & {
  /**
   * Emission Rate.
   * How many particles leave the emitter per second, spread evenly over time. Must be a positive, finite
   * number; the instance's `maxParticles` still caps the total on screen.
   *
   * @remarks Unit: particles per second.
   * @example
   * ```ts
   * Konfeti.emit({ rate: 25 }); // a gentle fountain
   * ```
   */
  readonly rate: number;
  /**
   * Emission Point.
   * An element, `"pointer"` or a normalized point; change it later with `emitter.moveTo()`.
   *
   * @defaultValue `{ x: 0.5, y: 0.6 }` (the same point `fire()` uses)
   * @see {@link EmitterTarget}
   */
  readonly follow?: EmitterTarget;
};
