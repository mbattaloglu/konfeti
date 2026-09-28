import { ShapeHandlers } from "../registry/ShapeHandlers";
import type { AnyShapeHandler } from "../types/shapes/ShapeHandler";

/**
 * Register Built-in Shape Handlers (for `konfeti/lite`).
 * The full `konfeti` entry already registers every shape; with `konfeti/lite` only paper is available until
 * you register the others you use, so unused shapes stay out of your bundle.
 *
 * @param handlers - Shape Handlers (`starShape`, `emojiShape`, …)
 * @example
 * ```ts
 * import { Konfeti, registerShapes, starShape, emojiShape } from "konfeti/lite";
 *
 * registerShapes(starShape, emojiShape);
 * Konfeti.fire({ shapes: [{ type: "star" }, { type: "emoji", emoji: "🎉" }] });
 * ```
 */
export function registerShapes(...handlers: readonly AnyShapeHandler[]): void {
  ShapeHandlers.register(...handlers);
}
