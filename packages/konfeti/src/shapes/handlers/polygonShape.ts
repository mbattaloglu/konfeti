import { VECTOR_DEFAULTS } from "../../config/ShapeDefaults";
import { ResolveUtils } from "../../core/resolve/ResolveUtils";
import type { PolygonShapeOptions } from "../../types/shapes/PolygonShapeOptions";
import type { ShapeHandler } from "../../types/shapes/ShapeHandler";
import { VectorPaths } from "../../utils/VectorPaths";
import { VectorSpawner } from "../spawn/VectorSpawner";
import { HandlerUtils } from "./HandlerUtils";

/**
 * Regular Polygon Shape Handler.
 */
export const polygonShape: ShapeHandler<PolygonShapeOptions> = {
  type: "polygon",
  resolve: (entry, { style, name }) => {
    const sides = ResolveUtils.intRange(
      entry.sides ?? VECTOR_DEFAULTS.polygonSides,
      VECTOR_DEFAULTS.minSides,
      VECTOR_DEFAULTS.maxSides,
      `${name}.sides`,
    );
    const variants = HandlerUtils.intSteps(sides).map((count) => VectorPaths.polygon(count));

    return VectorSpawner.create(
      style,
      entry.size ?? VECTOR_DEFAULTS.polygonSize,
      VectorSpawner.equal(variants),
      name,
    );
  },
};
