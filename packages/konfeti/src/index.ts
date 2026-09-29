// konfeti — batteries included: every built-in shape is registered, presets are exported and new instances
// print the console banner (konfeti/lite does none of these, so its bundles stay minimal).
import { registerShapes } from "./api/registerShapes";
import { BUILTIN_SHAPES } from "./shapes/handlers/BuiltinShapes";
import { Announcer } from "./utils/Announcer";
import { Banner } from "./utils/Banner";

export * from "./lite";
export { extendPreset } from "./presets/extendPreset";
export { KonfetiPresets } from "./presets/KonfetiPresets";
export type { KonfetiPresetName } from "./presets/KonfetiPresets";

registerShapes(...BUILTIN_SHAPES);
Announcer.setListener((renderer) => {
  Banner.show(renderer);
});
