import type { ColorInput } from "./ColorInput";
import type { Range } from "./Range";
import type { Pixels, Ratio } from "./Units";

/**
 * Motion Trail Settings.
 * Draws a short streak behind each particle through its last positions, thinning and fading toward the tail —
 * sparks, comets, fireworks.
 *
 * @example
 * ```ts
 * Konfeti.fire({ paper: { trail: true } });
 * Konfeti.fire({ shapes: [{ type: "star", trail: { length: 16, width: 4, color: "gold" } }] });
 * ```
 * @remarks Each trail segment is one stroke: `length` 10 costs about 10 extra draw calls per particle. Keep
 * `length` modest for large bursts.
 */
export type TrailOptions = {
  /**
   * Trail Length.
   * How many recent positions (one per frame) the trail runs through. Clamped to 2–32.
   *
   * @defaultValue `10`
   */
  readonly length?: number;
  /**
   * Head Width.
   * Line width right behind the particle; the trail tapers to nothing at its tail.
   *
   * @defaultValue `3`
   * @remarks Unit: pixels (CSS px).
   */
  readonly width?: Range<Pixels>;
  /**
   * Head Opacity.
   * Opacity right behind the particle, fading to transparent at the tail. It is multiplied by the particle's own
   * fade, so trails vanish with their particle. Clamped to 0–1.
   *
   * @defaultValue `0.5`
   */
  readonly opacity?: Ratio;
  /**
   * Trail Color.
   * `"particle"` uses each particle's own (front) color.
   *
   * @defaultValue `"particle"`
   */
  readonly color?: ColorInput | "particle";
};
