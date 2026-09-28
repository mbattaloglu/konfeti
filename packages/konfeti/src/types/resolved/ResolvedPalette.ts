import type { ColorMode } from "../ColorMode";
import type { Rgba } from "./Rgba";

/**
 * Normalized Color List.
 * CSS strings are precomputed so spawning never builds strings.
 */
export type ResolvedPalette = {
  /**
   * Canonical CSS Color List.
   */
  readonly colors: readonly string[];
  /**
   * Parsed Color List (index-aligned with `colors`).
   */
  readonly rgba: readonly Rgba[];
  /**
   * Auto Back-Side Color List (index-aligned with `colors`).
   */
  readonly shadedColors: readonly string[];
  /**
   * Cumulative Pick Weight List (index-aligned with `colors`).
   */
  readonly cumulativeWeights: readonly number[];
  /**
   * Total Pick Weight.
   */
  readonly totalWeight: number;
  /**
   * Color Pick Strategy.
   */
  readonly mode: ColorMode;
};
