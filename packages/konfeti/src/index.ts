// konfeti — batteries included: every built-in shape is registered and presets are exported.
import { registerShapes } from "./api/registerShapes";
import { BUILTIN_SHAPES } from "./shapes/handlers/BuiltinShapes";

export * from "./lite";
export { presets } from "./presets/Presets";
export type { Preset, PresetName } from "./presets/Presets";

registerShapes(...BUILTIN_SHAPES);
