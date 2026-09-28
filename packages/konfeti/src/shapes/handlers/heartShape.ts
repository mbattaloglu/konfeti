import { VECTOR_DEFAULTS } from "../../config/ShapeDefaults";
import type { HeartShapeOptions } from "../../types/shapes/HeartShapeOptions";
import type { ShapeHandler } from "../../types/shapes/ShapeHandler";
import { VectorPaths } from "../../utils/VectorPaths";
import { VectorSpawner } from "../spawn/VectorSpawner";

/**
 * Heart Shape Handler.
 */
export const heartShape: ShapeHandler<HeartShapeOptions> = {
  type: "heart",
  resolve: (entry, { style, name }) =>
    VectorSpawner.create(
      style,
      entry.size ?? VECTOR_DEFAULTS.heartSize,
      VectorSpawner.equal([VectorPaths.heart()]),
      name,
    ),
};
