import { ShapeHandlers } from "../../registry/ShapeHandlers";
import type { FireOptions } from "../../types/FireOptions";
import type { ResolvedShape } from "../../types/resolved/ResolvedShape";
import type { WeightedList } from "../../types/resolved/WeightedList";
import type { ShapeOptions } from "../../types/shapes/ShapeOptions";
import { WeightedListUtils } from "../../utils/WeightedListUtils";
import { ResolveUtils } from "./ResolveUtils";
import { StyleResolver } from "./StyleResolver";

/**
 * Resolution Context.
 */
export type ResolveContext = {
  /**
   * Canvas Pixel Ratio (bitmap raster resolution).
   */
  readonly pixelRatio: number;
};

/**
 * Static Shape Mix Resolver.
 * Looks up each entry's handler in {@link ShapeHandlers}, so only registered shapes end up in the bundle.
 */
export class ShapeResolver {
  /**
   * Default Shape Mix.
   */
  private static readonly DEFAULT_SHAPES: readonly ShapeOptions[] = [{ type: "paper" }];

  /**
   * Resolve Shape Mix from Fire Layers.
   *
   * @param layers - Fire Option Layers, Lowest Priority First
   * @param context - Resolution Context
   * @returns Weighted Resolved Shape List
   * @throws TypeError for unregistered shape types
   */
  public static resolveAll(
    layers: readonly FireOptions[],
    context: ResolveContext,
  ): WeightedList<ResolvedShape> {
    const paperLayers = layers.map((layer) => layer.paper);
    const entries = ResolveUtils.pick(layers, "shapes") ?? ShapeResolver.DEFAULT_SHAPES;

    return WeightedListUtils.build(
      entries.map((entry, index) => {
        const name = `shapes[${String(index)}]`;
        const handler = ShapeHandlers.get(entry.type);

        if (handler === undefined) {
          throw new TypeError(
            ShapeHandlers.isReserved(entry.type)
              ? `konfeti: shape "${entry.type}" is not registered — call registerShapes(${entry.type}Shape) when using konfeti/lite`
              : `konfeti: unknown shape type "${entry.type}" at ${name} — register it with defineShape()`,
          );
        }

        const style = StyleResolver.resolve([handler.styleDefaults, ...paperLayers, entry], name);
        // registries erase entry types; the handler was looked up by this entry's own type
        const resolved = handler.resolve(entry as never, {
          style,
          paperLayers,
          pixelRatio: context.pixelRatio,
          name,
        });

        return { value: resolved, weight: entry.weight ?? 1 };
      }),
      "shapes",
    );
  }
}
