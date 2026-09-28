import type { PaperGeometry } from "../PaperGeometry";
import type { ShapeEntryBase } from "./ShapeEntryBase";

/**
 * Paper Shape Entry.
 * The default confetti piece. Geometry keys fall back to `paper`.
 *
 * @example
 * ```ts
 * shapes: [{ type: "paper", form: "circle", weight: 2 }, { type: "star" }]
 * ```
 */
export type PaperShapeOptions = ShapeEntryBase &
  PaperGeometry & {
    /**
     * Shape Type.
     */
    readonly type: "paper";
  };
