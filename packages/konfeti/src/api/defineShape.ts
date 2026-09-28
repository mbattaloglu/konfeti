import { VECTOR_DEFAULTS } from "../config/ShapeDefaults";
import { ResolveUtils } from "../core/resolve/ResolveUtils";
import { ShapeHandlers } from "../registry/ShapeHandlers";
import { CustomSpawner } from "../shapes/spawn/CustomSpawner";
import { VectorSpawner } from "../shapes/spawn/VectorSpawner";
import type { Range } from "../types/Range";
import type { DrawShapeDefinition, ShapeDefinition } from "../types/shapes/ShapeDefinition";
import type { BuiltinShapeType } from "../types/shapes/ShapeOptions";
import type { ShapeRegistry } from "../types/shapes/ShapeRegistry";
import { RangeUtils } from "../utils/RangeUtils";
import { VectorPaths } from "../utils/VectorPaths";

/**
 * Register Custom Shape.
 * Declare its options on {@link ShapeRegistry} first; the name then becomes a typed `shapes[].type`.
 * Registering the same name again replaces the definition.
 *
 * @param name - Shape Type Name (not a built-in name)
 * @param definition - Path- or Draw-Based Definition
 * @throws TypeError for built-in names
 * @example
 * ```ts
 * declare module "konfeti" {
 *   interface ShapeRegistry {
 *     diamond: { sharpness?: number };
 *   }
 * }
 *
 * defineShape("diamond", {
 *   path: ({ sharpness = 0.5 }) => `M12 0L${24 - sharpness * 12} 12L12 24L${sharpness * 12} 12Z`,
 * });
 *
 * Konfeti.fire({ shapes: [{ type: "diamond", sharpness: 0.8 }] });
 * ```
 */
export function defineShape<K extends Exclude<keyof ShapeRegistry, BuiltinShapeType>>(
  name: K,
  definition: ShapeDefinition<ShapeRegistry[K] & object>,
): void {
  ShapeHandlers.registerCustom({
    type: name,
    resolve: (entry: object, { style, name: path }) => {
      // the registry only routes entries of this shape type here
      const options = entry as ShapeRegistry[K] & object;
      const entrySize = "size" in entry ? (entry.size as Range | undefined) : undefined;
      const size = entrySize ?? definition.defaultSize ?? VECTOR_DEFAULTS.pathSize;

      if ("path" in definition) {
        const variant = VectorPaths.fromPath(
          definition.path(options),
          definition.viewBox ?? VECTOR_DEFAULTS.pathViewBox,
        );
        return VectorSpawner.create(style, size, VectorSpawner.equal([variant]), path);
      }

      const aspect = definition.aspectRatio ?? 1;
      ResolveUtils.assertPositive(aspect, `${path} aspectRatio`);

      return CustomSpawner.create({
        kind: "custom",
        style,
        size: RangeUtils.toTuple(size, `${path}.size`),
        aspect,
        // the draw function only ever receives entries of this shape type
        draw: definition.draw as DrawShapeDefinition<object>["draw"],
        options: entry,
      });
    },
  });
}
