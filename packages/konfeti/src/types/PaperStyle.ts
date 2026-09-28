import type { PaperGeometry } from "./PaperGeometry";
import type { ShapeStyle } from "./ShapeStyle";

/**
 * Default Paper Particle Style.
 * Paper geometry plus the common {@link ShapeStyle}. Its common style keys are also the base style for every
 * other shape in `shapes`.
 *
 * @example
 * ```ts
 * Konfeti.fire({
 *   paper: {
 *     form: ["rect", "circle"],
 *     colors: ["#ff0a54", "#ffd000", "#00c2ff"],
 *     cornerRadius: 2,
 *     stroke: { color: "white", width: 0.5 },
 *   },
 * });
 * ```
 */
export type PaperStyle = PaperGeometry & ShapeStyle;
