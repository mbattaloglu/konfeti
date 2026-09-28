import type { BurstHooks } from "../BurstHooks";
import type { RangeTuple } from "../Range";
import type { ResolvedEmission } from "./ResolvedEmission";
import type { ResolvedOrigin } from "./ResolvedOrigin";
import type { ResolvedPhysics } from "./ResolvedPhysics";
import type { ResolvedShape } from "./ResolvedShape";
import type { WeightedList } from "./WeightedList";

/**
 * Fully Resolved Burst Options.
 * All-required internal form of `FireOptions` — the hot path never checks for `undefined`.
 */
export type ResolvedFireOptions = {
  /**
   * Particle Count (per shot for interval emission).
   */
  readonly particleCount: number;
  /**
   * Spawn Origin.
   */
  readonly origin: ResolvedOrigin;
  /**
   * Launch Angle Range in Degrees.
   */
  readonly angle: RangeTuple;
  /**
   * Launch Cone Width in Degrees.
   */
  readonly spread: number;
  /**
   * Launch Speed Range.
   */
  readonly startVelocity: RangeTuple;
  /**
   * Lifetime Range in Milliseconds.
   */
  readonly lifetime: RangeTuple;
  /**
   * Emission Timing.
   */
  readonly emission: ResolvedEmission;
  /**
   * Weighted Shape List.
   */
  readonly shapes: WeightedList<ResolvedShape>;
  /**
   * Physics Settings.
   */
  readonly physics: ResolvedPhysics;
  /**
   * Lifecycle Hooks.
   */
  readonly hooks: BurstHooks;
  /**
   * Random Seed.
   */
  readonly seed: number;
};
