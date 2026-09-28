import type { OneOrMany } from "../types/OneOrMany";
import type { WeightedList } from "../types/resolved/WeightedList";
import type { Weighted } from "../types/Weighted";
import type { Random } from "./Random";

/**
 * Static Weighted List Helpers.
 */
export class WeightedListUtils {
  /**
   * Build Weighted List from Entries.
   *
   * @param entries - Values with Weights
   * @param name - Option Name for Error Messages
   * @returns Weighted List
   * @throws TypeError on empty lists or non-positive weights
   */
  public static build<T>(
    entries: readonly { readonly value: T; readonly weight: number }[],
    name: string,
  ): WeightedList<T> {
    if (entries.length === 0) {
      throw new TypeError(`konfeti: "${name}" must not be empty`);
    }

    const items: T[] = [];
    const cumulativeWeights: number[] = [];
    let totalWeight = 0;

    for (const entry of entries) {
      if (!Number.isFinite(entry.weight) || entry.weight <= 0) {
        throw new TypeError(
          `konfeti: "${name}" weights must be positive numbers, got ${String(entry.weight)}`,
        );
      }

      totalWeight += entry.weight;
      items.push(entry.value);
      cumulativeWeights.push(totalWeight);
    }

    return { items, cumulativeWeights, totalWeight };
  }

  /**
   * Normalize Single Value or Weighted List into Entries.
   *
   * @param input - Single Value or List
   * @returns Entries with Weights
   */
  public static entries<T>(input: OneOrMany<T>): { value: T; weight: number }[] {
    const list: readonly (T | Weighted<T>)[] = WeightedListUtils.isList(input) ? input : [input];

    return list.map((entry) =>
      WeightedListUtils.isWeighted(entry)
        ? { value: entry.value, weight: entry.weight }
        : { value: entry, weight: 1 },
    );
  }

  /**
   * Pick Random Entry Index.
   *
   * @param list - Weighted List (or palette with the same weight fields)
   * @param random - Random Generator
   * @returns Entry Index
   */
  public static pickIndex(
    list: { readonly cumulativeWeights: readonly number[]; readonly totalWeight: number },
    random: Random,
  ): number {
    const weights = list.cumulativeWeights;

    if (weights.length <= 1) {
      return 0;
    }

    const target = random.next() * list.totalWeight;

    for (let index = 0; index < weights.length; index++) {
      if (target < (weights[index] ?? 0)) {
        return index;
      }
    }

    return weights.length - 1;
  }

  /**
   * Pick Random Entry.
   *
   * @param list - Weighted List
   * @param random - Random Generator
   * @returns Entry
   * @throws Error on an empty list (cannot happen for built lists)
   */
  public static pick<T>(list: WeightedList<T>, random: Random): T {
    const item = list.items[WeightedListUtils.pickIndex(list, random)];

    if (item === undefined) {
      throw new Error("konfeti: empty weighted list");
    }

    return item;
  }

  /**
   * Check Weighted Wrapper.
   *
   * @param entry - List Entry
   * @returns Weighted Wrapper Flag
   */
  private static isWeighted<T>(entry: T | Weighted<T>): entry is Weighted<T> {
    return typeof entry === "object" && entry !== null && "value" in entry && "weight" in entry;
  }

  /**
   * Check List Form.
   *
   * @param input - Single Value or List
   * @returns List Flag
   */
  private static isList<T>(input: OneOrMany<T>): input is readonly (T | Weighted<T>)[] {
    return Array.isArray(input);
  }
}
