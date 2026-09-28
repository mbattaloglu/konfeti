import { VECTOR_DEFAULTS } from "../../config/ShapeDefaults";
import { ResolveUtils } from "../../core/resolve/ResolveUtils";
import type { PathShapeOptions } from "../../types/shapes/PathShapeOptions";
import type { ShapeHandler } from "../../types/shapes/ShapeHandler";
import { VectorPaths } from "../../utils/VectorPaths";
import { WeightedListUtils } from "../../utils/WeightedListUtils";
import { VectorSpawner } from "../spawn/VectorSpawner";

/**
 * Custom SVG Path Shape Handler.
 */
export const pathShape: ShapeHandler<PathShapeOptions> = {
  type: "path",
  resolve: (entry, { style, name }) => {
    const viewBox = entry.viewBox ?? VECTOR_DEFAULTS.pathViewBox;
    ResolveUtils.assertPositive(viewBox[0], `${name}.viewBox[0]`);
    ResolveUtils.assertPositive(viewBox[1], `${name}.viewBox[1]`);

    return VectorSpawner.create(
      style,
      entry.size ?? VECTOR_DEFAULTS.pathSize,
      WeightedListUtils.entries(entry.path).map(({ value, weight }) => ({
        value: VectorPaths.fromPath(value, viewBox),
        weight,
      })),
      `${name}.path`,
    );
  },
};
