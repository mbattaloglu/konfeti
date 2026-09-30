import type { Easing } from "../Easing";
import type { Milliseconds, Pixels, Ratio } from "../Units";
import type { FormationMode } from "./FormationMode";

/**
 * Settings Shared by Text and Image Formations.
 *
 * @see {@link FormationOptions}
 */
export type FormationBase = {
  /**
   * Start Mode.
   * `"assemble"` flies every particle in from beyond the canvas edges to its place in the shape; `"appear"`
   * shows the particles in the shape at once.
   *
   * @defaultValue `"assemble"`
   * @example
   * ```ts
   * Konfeti.fire({ formation: { text: "WOW", mode: "appear", hold: 600 } });
   * ```
   * @see {@link FormationMode}
   */
  readonly mode?: FormationMode;
  /**
   * Fly-In Duration.
   * How long `"assemble"` takes until the shape is complete. Particles set off with small random delays, so
   * the shape fills in organically; ignored by `"appear"`. Must be zero or more.
   *
   * @defaultValue `900`
   * @remarks Unit: milliseconds.
   */
  readonly assemble?: Milliseconds;
  /**
   * Hold Time.
   * How long the finished shape stays on screen before the particles burst apart. Must be zero or more.
   *
   * @defaultValue `1000`
   * @remarks Unit: milliseconds. The particles' `lifetime`, and every fade or change over life, starts when
   * they burst, so the shape stays fully visible until then. `fadeIn` has no effect on formations.
   */
  readonly hold?: Milliseconds;
  /**
   * Fly-In Easing.
   * How the particles move toward their places during `"assemble"`.
   *
   * @defaultValue `"easeOutCubic"` (fast start, soft landing)
   * @see {@link Easing}
   */
  readonly easing?: Easing;
  /**
   * Particle Spacing.
   * Distance between neighbouring particles in the shape: smaller is denser and easier to read, but needs
   * more particles. The particle count follows from it; an explicit `particleCount` only caps it. Must be a
   * positive number.
   *
   * @defaultValue `8`
   * @example
   * ```ts
   * Konfeti.fire({ formation: { text: "OK", spacing: 6 } }); // denser letters
   * ```
   * @remarks Unit: pixels (CSS px), before `fit` scales the formation down. Halving the spacing roughly
   * quadruples the particle count; the instance's `maxParticles` still caps it, and the shape then thins out
   * evenly instead of losing a part.
   */
  readonly spacing?: Pixels;
  /**
   * Largest Share of the Canvas.
   * The whole formation (shape, spacing and particle size) is scaled down, never up, until it fits into this
   * share of the canvas width and height: a phone shows a smaller copy of the same picture, with the same
   * number of particles.
   *
   * @defaultValue `0.9`
   * @remarks Unit: ratio of the canvas size, `0–1`; values outside are clamped to `0.05–1`.
   */
  readonly fit?: Ratio;
};
