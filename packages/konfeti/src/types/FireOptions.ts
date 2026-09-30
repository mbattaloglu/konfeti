import type { BurstHooks } from "./BurstHooks";
import type { EmissionOptions } from "./EmissionOptions";
import type { FormationOptions } from "./formation/FormationOptions";
import type { Origin } from "./Origin";
import type { PaperStyle } from "./PaperStyle";
import type { PhysicsOptions } from "./PhysicsOptions";
import type { Range } from "./Range";
import type { ShapeOptions } from "./shapes/ShapeOptions";
import type { Degrees, Milliseconds, PixelsPerSecond } from "./Units";

/**
 * Options for a Single Burst.
 * Everything is optional — `Konfeti.fire()` with no arguments produces a classic confetti pop.
 *
 * @example
 * ```ts
 * Konfeti.fire({
 *   particleCount: 120,
 *   angle: 60,
 *   spread: 55,
 *   origin: { x: 0, y: 0.7 },
 *   paper: { colors: ["#bb0000", "#ffffff"] },
 *   shapes: [{ type: "paper", weight: 3 }, { type: "emoji", emoji: "🎉" }],
 * });
 * ```
 */
export type FireOptions = BurstHooks & {
  /**
   * Number of Particles.
   * For `"interval"` emission this is per shot. Rounded down; negative values become `0`. Capped by the
   * instance's `maxParticles`.
   *
   * @defaultValue `60`
   */
  readonly particleCount?: number;
  /**
   * Spawn Origin.
   *
   * @defaultValue `{ x: 0.5, y: 0.6 }`
   * @see {@link Origin}
   */
  readonly origin?: Origin;
  /**
   * Launch Direction.
   * `90` shoots straight up, `0` right, `180` left, `270` down.
   *
   * @defaultValue `90`
   */
  readonly angle?: Range<Degrees>;
  /**
   * Launch Cone Width.
   * Total opening angle around `angle`. `360` shoots in every direction.
   *
   * @defaultValue `60`
   */
  readonly spread?: Degrees;
  /**
   * Launch Speed.
   * For a `formation`, the speed at which the particles burst apart from the shape.
   *
   * @defaultValue `[1000, 1800]` (`[300, 700]` with a `formation`)
   */
  readonly startVelocity?: Range<PixelsPerSecond>;
  /**
   * Particle Lifetime.
   * Particles are removed after this time (and earlier once they fall below the canvas, unless a floor is set).
   *
   * @defaultValue `[2800, 3600]`
   */
  readonly lifetime?: Range<Milliseconds>;
  /**
   * Emission Timing.
   *
   * @defaultValue `{ mode: "burst" }`
   * @see {@link EmissionOptions}
   */
  readonly emission?: EmissionOptions;
  /**
   * Start Delay.
   * Waits this long after `fire()` before the burst starts. Give the entries of a list different delays to
   * choreograph them: a cannon shot, then a message, then a finale.
   *
   * @defaultValue `0`
   * @example
   * ```ts
   * Konfeti.fire([
   *   { origin: { x: 0, y: 0.8 }, angle: 60 },
   *   { origin: { x: 1, y: 0.8 }, angle: 120, delay: 250 },
   *   { formation: { text: "HOORAY" }, delay: 600 },
   * ]);
   * ```
   * @remarks Unit: milliseconds; must be zero or more. Paused time does not count, and the handle resolves once
   * the delayed burst has finished.
   */
  readonly delay?: Milliseconds;
  /**
   * Paper Style (and base style for every shape).
   *
   * @see {@link PaperStyle}
   */
  readonly paper?: PaperStyle;
  /**
   * Shape Mix.
   * Each particle picks one entry (respecting `weight`). Omitted = paper only.
   *
   * @defaultValue `[{ type: "paper" }]`
   * @example
   * ```ts
   * shapes: [
   *   { type: "paper", weight: 4 },
   *   { type: "star", colors: "gold" },
   *   { type: "emoji", emoji: ["🎉", "🥳"] },
   * ]
   * ```
   * @see {@link ShapeOptions}
   */
  readonly shapes?: readonly ShapeOptions[];
  /**
   * Motion Physics.
   *
   * @see {@link PhysicsOptions}
   */
  readonly physics?: PhysicsOptions;
  /**
   * Random Seed.
   * The same seed with the same options and canvas size reproduces the exact same burst.
   *
   * @defaultValue random
   */
  readonly seed?: number;
  /**
   * Formation.
   * The particles first form a text or an image, hold it, then burst apart. The shape is centered on
   * `origin`; `startVelocity` becomes the speed at which the particles fly outward, and `particleCount` (if
   * set) only caps the count the shape needs.
   *
   * @defaultValue none (a regular burst)
   * @example
   * ```ts
   * Konfeti.fire({ formation: { text: "TEBRİKLER" }, origin: { x: 0.5, y: 0.4 } });
   * Konfeti.fire({ formation: { image: "/logo.png", mode: "appear", hold: 1500 } });
   * ```
   * @remarks Needs `emission: { mode: "burst" }` (the default). With `konfeti/lite`, call
   * `enableFormations()` once first.
   * @see {@link FormationOptions}
   */
  readonly formation?: FormationOptions;
};
