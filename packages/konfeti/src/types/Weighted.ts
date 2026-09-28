/**
 * Value with Pick Weight.
 * Used in lists to make some entries appear more often. Plain (non-weighted) entries count as weight `1`.
 *
 * @example
 * ```ts
 * form: ["rect", { value: "circle", weight: 3 }] // circles are 3× as common as rects
 * ```
 */
export type Weighted<T> = {
  /**
   * Entry Value.
   */
  readonly value: T;
  /**
   * Relative Pick Weight.
   * Must be `> 0`.
   *
   * @defaultValue `1`
   */
  readonly weight: number;
};
