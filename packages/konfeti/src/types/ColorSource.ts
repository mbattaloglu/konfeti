import type { ColorInput } from "./ColorInput";
import type { WeightedColor } from "./WeightedColor";

/**
 * Single Color or Color List.
 * With a list, each particle picks one entry (see `colorMode`). Lists may mix plain and weighted colors.
 *
 * @example
 * ```ts
 * colors: "gold"
 * colors: ["#ff0a54", "#ffd000", "#00c2ff"]
 * colors: [{ color: "gold", weight: 4 }, "silver"]
 * ```
 */
export type ColorSource = ColorInput | readonly (ColorInput | WeightedColor)[];
