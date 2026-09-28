import { VECTOR_DEFAULTS } from "../../config/ShapeDefaults";
import { ResolveUtils } from "../../core/resolve/ResolveUtils";
import type { ShapeHandler } from "../../types/shapes/ShapeHandler";
import type { StarShapeOptions } from "../../types/shapes/StarShapeOptions";
import { MathUtils } from "../../utils/MathUtils";
import { VectorPaths } from "../../utils/VectorPaths";
import { VectorSpawner } from "../spawn/VectorSpawner";
import { HandlerUtils } from "./HandlerUtils";

/**
 * Star Shape Handler.
 */
export const starShape: ShapeHandler<StarShapeOptions> = {
  type: "star",
  resolve: (entry, { style, name }) => {
    const points = ResolveUtils.intRange(
      entry.points ?? VECTOR_DEFAULTS.starPoints,
      VECTOR_DEFAULTS.minSides,
      VECTOR_DEFAULTS.maxSides,
      `${name}.points`,
    );
    const inner = MathUtils.clamp(entry.innerRatio ?? VECTOR_DEFAULTS.starInnerRatio, 0.05, 1);
    const variants = HandlerUtils.intSteps(points).map((count) => VectorPaths.star(count, inner));

    return VectorSpawner.create(
      style,
      entry.size ?? VECTOR_DEFAULTS.starSize,
      VectorSpawner.equal(variants),
      name,
    );
  },
};
