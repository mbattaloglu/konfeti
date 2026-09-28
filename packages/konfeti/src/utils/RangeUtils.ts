import type { Range, RangeTuple } from "../types/Range";
import type { Random } from "./Random";

/**
 * Static Range Normalization and Sampling Helpers.
 */
export class RangeUtils {
  /**
   * Normalize Range into Ordered Tuple.
   * Validates that both bounds are finite numbers.
   *
   * @param range - Public Range Value
   * @param name - Option Name for Error Messages
   * @returns Ordered `[min, max]` Tuple
   */
  public static toTuple(range: Range, name: string): RangeTuple {
    let min: number;
    let max: number;

    if (typeof range === "number") {
      min = range;
      max = range;
    } else if (RangeUtils.isTuple(range)) {
      [min, max] = range;
    } else {
      min = range.min;
      max = range.max;
    }

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      throw new TypeError(
        `konfeti: "${name}" must be a finite number or range, got ${JSON.stringify(range)}`,
      );
    }

    return min <= max ? [min, max] : [max, min];
  }

  /**
   * Sample Random Value from Tuple.
   *
   * @param range - Ordered Tuple
   * @param random - Random Generator
   * @returns Sampled Value
   */
  public static sample(range: RangeTuple, random: Random): number {
    return range[0] === range[1] ? range[0] : random.between(range[0], range[1]);
  }

  /**
   * Check Range Tuple Form.
   *
   * @param range - Non-Numeric Range
   * @returns Tuple Flag
   */
  private static isTuple(range: Exclude<Range, number>): range is RangeTuple {
    return Array.isArray(range);
  }
}
