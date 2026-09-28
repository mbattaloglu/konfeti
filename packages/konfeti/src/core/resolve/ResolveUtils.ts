import type { Range, RangeTuple } from "../../types/Range";
import { RangeUtils } from "../../utils/RangeUtils";

/**
 * Static Layer-Merging and Validation Helpers Shared by Resolvers.
 */
export class ResolveUtils {
  /**
   * Return Highest-Priority Defined Value.
   *
   * @param layers - Option Layers, Lowest Priority First
   * @param key - Option Key
   * @returns Defined Value or Undefined
   */
  public static pick<T extends object, K extends keyof T>(
    layers: readonly (T | undefined)[],
    key: K,
  ): NonNullable<T[K]> | undefined {
    for (let index = layers.length - 1; index >= 0; index--) {
      const entry = layers[index]?.[key];

      if (entry !== undefined && entry !== null) {
        return entry;
      }
    }

    return undefined;
  }

  /**
   * Merge Boolean-or-Object Option Layers.
   * `false` disables, `true` re-enables with the accumulated settings, objects merge key by key.
   *
   * @param layers - Toggle Layers, Lowest Priority First
   * @param defaults - Complete Default Settings
   * @returns Merged Settings or `false`
   */
  public static mergeToggle<T extends object>(
    layers: readonly (boolean | Partial<T> | undefined)[],
    defaults: T,
  ): T | false {
    let result = defaults as T | false;

    for (const layer of layers) {
      if (layer === undefined) {
        continue;
      }

      if (layer === false) {
        result = false;
      } else if (layer === true) {
        result = result === false ? defaults : result;
      } else {
        result = { ...(result === false ? defaults : result), ...ResolveUtils.definedOnly(layer) };
      }
    }

    return result;
  }

  /**
   * Remove Undefined Keys from Object.
   *
   * @param value - Partial Object
   * @returns Object without Undefined Keys
   */
  public static definedOnly<T extends object>(value: Partial<T>): Partial<T> {
    return Object.fromEntries(
      Object.entries(value).filter(([, entry]) => entry !== undefined),
    ) as Partial<T>;
  }

  /**
   * Normalize Integer Range and Clamp It.
   *
   * @param range - Public Range
   * @param min - Lower Clamp
   * @param max - Upper Clamp
   * @param name - Option Name for Error Messages
   * @returns Integer Tuple
   */
  public static intRange(range: Range, min: number, max: number, name: string): RangeTuple {
    const [low, high] = RangeUtils.toTuple(range, name);
    const clamp = (value: number): number => Math.min(Math.max(Math.round(value), min), max);
    return [clamp(low), clamp(high)];
  }

  /**
   * Assert Finite Number.
   *
   * @param value - Numeric Option
   * @param name - Option Name for Error Messages
   * @throws TypeError when not finite
   */
  public static assertFinite(value: number, name: string): void {
    if (!Number.isFinite(value)) {
      throw new TypeError(`konfeti: "${name}" must be a finite number, got ${String(value)}`);
    }
  }

  /**
   * Assert Positive Finite Number.
   *
   * @param value - Numeric Option
   * @param name - Option Name for Error Messages
   * @throws TypeError when not finite or not positive
   */
  public static assertPositive(value: number, name: string): void {
    if (!Number.isFinite(value) || value <= 0) {
      throw new TypeError(`konfeti: "${name}" must be a positive number, got ${String(value)}`);
    }
  }
}
