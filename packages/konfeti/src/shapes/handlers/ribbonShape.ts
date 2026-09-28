import { VECTOR_DEFAULTS } from "../../config/ShapeDefaults";
import type { RibbonShapeOptions } from "../../types/shapes/RibbonShapeOptions";
import type { ShapeHandler } from "../../types/shapes/ShapeHandler";
import { MathUtils } from "../../utils/MathUtils";
import { VectorPaths } from "../../utils/VectorPaths";
import { VectorSpawner } from "../spawn/VectorSpawner";

/**
 * Curly Ribbon Shape Handler.
 */
export const ribbonShape: ShapeHandler<RibbonShapeOptions> = {
  type: "ribbon",
  styleDefaults: { flip: { axis: "y" } },
  resolve: (entry, { style, name }) => {
    const waves = Math.round(
      MathUtils.clamp(
        entry.waves ?? VECTOR_DEFAULTS.ribbonWaves,
        1,
        VECTOR_DEFAULTS.maxRibbonWaves,
      ),
    );
    const thickness = MathUtils.clamp(
      entry.thickness ?? VECTOR_DEFAULTS.ribbonThickness,
      0.02,
      0.5,
    );

    return VectorSpawner.create(
      style,
      entry.length ?? VECTOR_DEFAULTS.ribbonLength,
      VectorSpawner.equal([VectorPaths.ribbon(waves, thickness)]),
      name,
    );
  },
};
