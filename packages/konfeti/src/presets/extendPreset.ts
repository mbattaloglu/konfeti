import type { FireInput } from "../types/FireInput";
import type { FireOptions } from "../types/FireOptions";
import { PresetUtils } from "./PresetUtils";

/**
 * Combine a Preset with Your Own Settings.
 * Returns new options with `overrides` merged into every burst of the preset (a preset such as
 * `SIDE_SHOTS` has several). Top-level keys are replaced; `paper` and `physics` merge key by key, so you
 * can change one paper setting without losing the preset's others. The preset itself is never modified.
 *
 * @param preset - Preset (or any fire input) to Start from
 * @param overrides - Settings that Win over the Preset
 * @returns Fire Input to Pass to `fire()`
 * @example
 * ```ts
 * Konfeti.fire(extendPreset(KonfetiPresets.SNOW, { emission: { mode: "stream", duration: 10000 } }));
 * Konfeti.fire(extendPreset(KonfetiPresets.SIDE_SHOTS, { paper: { colors: ["gold", "white"] } }));
 * ```
 */
export function extendPreset(preset: FireInput, overrides: FireOptions): FireInput {
  return PresetUtils.apply(PresetUtils.isList(preset) ? preset : [preset], overrides);
}
