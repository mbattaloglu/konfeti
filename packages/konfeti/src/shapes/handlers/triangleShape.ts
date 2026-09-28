import { VECTOR_DEFAULTS } from "../../config/ShapeDefaults";
import type { ShapeHandler } from "../../types/shapes/ShapeHandler";
import type { TriangleShapeOptions } from "../../types/shapes/TriangleShapeOptions";
import { VectorPaths } from "../../utils/VectorPaths";
import { VectorSpawner } from "../spawn/VectorSpawner";

/**
 * Triangle Shape Handler.
 */
export const triangleShape: ShapeHandler<TriangleShapeOptions> = {
  type: "triangle",
  resolve: (entry, { style, name }) =>
    VectorSpawner.create(
      style,
      entry.size ?? VECTOR_DEFAULTS.triangleSize,
      VectorSpawner.equal([VectorPaths.triangle()]),
      name,
    ),
};
