/**
 * Inclusive Range as `[min, max]` Tuple.
 */
export type RangeTuple<T extends number = number> = readonly [min: T, max: T];

/**
 * Inclusive Range as `{ min, max }` Object.
 */
export type RangeObject<T extends number = number> = {
  /**
   * Lower Bound.
   */
  readonly min: T;
  /**
   * Upper Bound.
   */
  readonly max: T;
};

/**
 * Fixed Value or Random Range.
 * A plain number is used as-is. A tuple or object picks a uniformly random value between `min` and `max`
 * (inclusive) separately for every particle. If `min > max` the bounds are swapped.
 *
 * @example
 * ```ts
 * size: 10            // every particle is 10
 * size: [8, 14]       // each particle gets a random size between 8 and 14
 * size: { min: 8, max: 14 } // same as above
 * ```
 */
export type Range<T extends number = number> = T | RangeTuple<T> | RangeObject<T>;
