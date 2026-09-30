import type { EmitterTarget } from "./EmitterTarget";
import type { Range } from "./Range";
import type { Pixels, PixelsPerSecondSquared } from "./Units";

/**
 * How the Pull of an Attractor Changes with Distance.
 * - `"constant"`: the same pull everywhere inside the radius;
 * - `"linear"`: full pull at the target, fading to nothing at the radius (needs a finite `radius`).
 */
export type AttractFalloff = "constant" | "linear";

/**
 * Attractor / Repulsor Settings.
 * Pulls every particle toward a target — the pointer, an element or a point — or pushes it away with a negative
 * `strength`. The target is looked up once per frame, so it can move.
 *
 * @example
 * ```ts
 * Konfeti.fire({ physics: { attract: true } }); // pulled toward the pointer
 * Konfeti.fire({ physics: { attract: { target: basket, strength: 1500 } } }); // into an element
 * Konfeti.fire({ physics: { attract: { target: "pointer", strength: -2000, radius: 150 } } }); // pushed away
 * ```
 */
export type AttractOptions = {
  /**
   * Target.
   * An element (its center, measured every frame), `"pointer"` (no pull until the pointer moves over the page)
   * or a normalized point `{ x, y }` (0–1 of the canvas).
   *
   * @defaultValue `"pointer"`
   * @remarks In worker instances an element is measured once when fired and `"pointer"` has no effect.
   */
  readonly target?: EmitterTarget;
  /**
   * Pull Strength.
   * Acceleration toward the target; a negative value pushes particles away (a repulsor). Sampled per particle,
   * so a range makes some pieces react more than others.
   *
   * @defaultValue `900`
   * @remarks Unit: pixels per second squared. Gravity and drag still apply, so a pull weaker than `gravity`
   * slows the fall rather than lifting particles.
   */
  readonly strength?: Range<PixelsPerSecondSquared>;
  /**
   * Reach.
   * Particles farther than this from the target are not affected. `Infinity` reaches the whole canvas.
   *
   * @defaultValue `Infinity`
   * @remarks Unit: pixels (CSS px).
   */
  readonly radius?: Pixels;
  /**
   * Distance Falloff.
   *
   * @defaultValue `"constant"`
   * @see {@link AttractFalloff}
   */
  readonly falloff?: AttractFalloff;
};
