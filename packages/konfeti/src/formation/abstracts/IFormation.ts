import type { RenderSurface } from "../../core/RenderSurface";
import type { Particle } from "../../particles/Particle";
import type { PlacedOrigin } from "../../types/resolved/PlacedOrigin";
import type { ResolvedStyle } from "../../types/resolved/ResolvedStyle";
import type { Random } from "../../utils/Random";

/**
 * Formation Contract (one per burst).
 * The core only talks to a formation through this type, so bundles without `enableFormations()` carry none
 * of the formation code.
 */
export type IFormation = {
  /**
   * Check Whether the Shape Can Be Sampled (an image may still be loading).
   *
   * @returns Ready Flag
   */
  isReady(): boolean;
  /**
   * Check Whether the Shape Failed to Load (the burst then ends without particles).
   *
   * @returns Failed Flag
   */
  hasFailed(): boolean;
  /**
   * Sample the Target Points for the Current Canvas.
   *
   * @param surface - Drawing Surface
   * @param origin - Burst Origin (the center of the shape)
   * @param random - Burst Random Generator
   * @returns Number of Particles the Shape Needs
   */
  prepare(surface: RenderSurface, origin: PlacedOrigin, random: Random): number;
  /**
   * Return the Size Multiplier of the Particles (the shape's fit scale, set by `prepare()`).
   *
   * @returns Multiplier (`1` when the shape fits as it is)
   */
  getScale(): number;
  /**
   * Place a Newly Spawned Particle (start, target, burst-apart velocity, image color).
   *
   * @param particle - Particle
   * @param index - Spawn Index within the Burst
   * @param random - Burst Random Generator
   * @param style - Resolved Style of the Particle's Shape
   */
  place(particle: Particle, index: number, random: Random, style: ResolvedStyle): void;
  /**
   * Move a Forming Particle.
   *
   * @param particle - Particle
   * @param dt - Time Step in Seconds
   * @returns Still Forming Flag (`false` once the particle is released in this step)
   */
  step(particle: Particle, dt: number): boolean;
};
