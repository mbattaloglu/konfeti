import type { EasingFunction } from "../../types/Easing";
import type { FormationMode } from "../../types/formation/FormationMode";

/**
 * Resolved Formation Settings (all required).
 */
export type FormationSettings = {
  /**
   * Start Mode.
   */
  readonly mode: FormationMode;
  /**
   * Fly-In Duration in Milliseconds (`0` for `"appear"`).
   */
  readonly assemble: number;
  /**
   * Hold Time in Milliseconds.
   */
  readonly hold: number;
  /**
   * Fly-In Easing.
   */
  readonly easing: EasingFunction;
  /**
   * Particle Spacing in CSS Pixels.
   */
  readonly spacing: number;
  /**
   * Largest Share of the Canvas (0.05–1).
   */
  readonly fit: number;
  /**
   * Paint Particles with the Pixel Colors Flag.
   */
  readonly imageColors: boolean;
  /**
   * Largest Particle Count (an explicit `particleCount`, or Infinity).
   */
  readonly limit: number;
};
