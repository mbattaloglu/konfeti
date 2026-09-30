import type { ImageFormation } from "./ImageFormation";
import type { TextFormation } from "./TextFormation";

/**
 * Formation Settings.
 * Particles first form a shape, text or an image, hold it, then burst apart. Set `text` or `image` (not
 * both); every shape type can take part, and the rest of the burst options apply as usual once the shape
 * breaks up: `startVelocity` becomes the speed at which particles fly outward from the shape's center.
 *
 * @example
 * ```ts
 * Konfeti.fire({
 *   origin: { x: 0.5, y: 0.4 }, // the center of the shape
 *   formation: { text: "TEBRİKLER", font: "900 110px sans-serif", hold: 1200 },
 *   shapes: [{ type: "paper", weight: 3 }, { type: "star" }],
 * });
 * Konfeti.fire({ formation: { image: "/logo.png", mode: "appear" }, startVelocity: [300, 600] });
 * ```
 * @remarks Needs `emission: { mode: "burst" }` (the default), and is not available for `emit()`. With
 * `konfeti/lite`, call `enableFormations()` once first.
 * @see {@link TextFormation}
 * @see {@link ImageFormation}
 */
export type FormationOptions = TextFormation | ImageFormation;
