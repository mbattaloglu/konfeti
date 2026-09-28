/**
 * Resolved Weighted Pick List.
 */
export type WeightedList<T> = {
  /**
   * Entry List.
   */
  readonly items: readonly T[];
  /**
   * Cumulative Weight List (index-aligned with `items`).
   */
  readonly cumulativeWeights: readonly number[];
  /**
   * Total Weight.
   */
  readonly totalWeight: number;
};
