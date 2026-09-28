import type { ResolvedFireOptions } from "../../src/types/resolved/ResolvedFireOptions";
import type { ResolvedPaperShape, ResolvedShape } from "../../src/types/resolved/ResolvedShape";

/**
 * Return Resolved Shape at Index.
 *
 * @param resolved - Resolved Fire Options
 * @param index - Shape Index
 * @returns Resolved Shape
 */
export function shapeAt(resolved: ResolvedFireOptions, index = 0): ResolvedShape {
  const shape = resolved.shapes.items[index];

  if (shape === undefined) {
    throw new Error(`no shape at ${String(index)}`);
  }

  return shape;
}

/**
 * Return First Shape as Paper.
 *
 * @param resolved - Resolved Fire Options
 * @returns Resolved Paper Shape
 */
export function paperOf(resolved: ResolvedFireOptions): ResolvedPaperShape {
  const shape = shapeAt(resolved);

  if (shape.kind !== "paper") {
    throw new Error(`expected paper, got ${shape.kind}`);
  }

  return shape;
}
