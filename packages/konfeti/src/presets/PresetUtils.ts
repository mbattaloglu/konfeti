import type { FireInput } from "../types/FireInput";
import type { FireOptions } from "../types/FireOptions";

/**
 * Static Preset Helpers.
 */
export class PresetUtils {
  /**
   * Merge User Overrides into Preset Bursts.
   * Top-level keys are replaced; `paper` and `physics` merge key by key.
   *
   * @param bursts - Preset Burst List
   * @param overrides - User Overrides
   * @returns Fire Input (single burst when the preset has one)
   */
  public static apply(bursts: readonly FireOptions[], overrides: FireOptions = {}): FireInput {
    const merged = bursts.map((burst) => PresetUtils.merge(burst, overrides));
    return merged.length === 1 && merged[0] !== undefined ? merged[0] : merged;
  }

  /**
   * Check Whether a Fire Input Is a Burst List.
   *
   * @param input - Fire Input
   * @returns List Flag
   */
  public static isList(input: FireInput): input is readonly FireOptions[] {
    return Array.isArray(input);
  }

  /**
   * Merge Two Burst Option Objects.
   *
   * @param base - Preset Options
   * @param overrides - User Overrides
   * @returns Merged Options
   */
  private static merge(base: FireOptions, overrides: FireOptions): FireOptions {
    const merged: FireOptions = { ...base, ...overrides };
    const paper = base.paper || overrides.paper ? { ...base.paper, ...overrides.paper } : undefined;
    const physics =
      base.physics || overrides.physics ? { ...base.physics, ...overrides.physics } : undefined;

    return {
      ...merged,
      ...(paper === undefined ? {} : { paper }),
      ...(physics === undefined ? {} : { physics }),
    };
  }
}
