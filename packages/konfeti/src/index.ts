// konfeti — batteries included: every built-in shape is registered and presets are exported.
import { registerShapes } from "./api/registerShapes";
import { BUILTIN_SHAPES } from "./shapes/handlers/BuiltinShapes";

export * from "./lite";
export { extendPreset } from "./presets/extendPreset";
export { KonfetiPresets } from "./presets/KonfetiPresets";
export type { KonfetiPresetName } from "./presets/KonfetiPresets";

registerShapes(...BUILTIN_SHAPES);
