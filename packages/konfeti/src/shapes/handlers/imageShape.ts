import { BITMAP_DEFAULTS } from "../../config/ShapeDefaults";
import type { ImageShapeOptions } from "../../types/shapes/ImageShapeOptions";
import type { ShapeHandler } from "../../types/shapes/ShapeHandler";
import { ImageSource } from "../../utils/ImageSource";
import { RangeUtils } from "../../utils/RangeUtils";
import { WeightedListUtils } from "../../utils/WeightedListUtils";
import { BitmapSpawner } from "../spawn/BitmapSpawner";

/**
 * Image Shape Handler.
 */
export const imageShape: ShapeHandler<ImageShapeOptions> = {
  type: "image",
  styleDefaults: { flip: false, rotation: [-20, 20], rotationSpeed: [-90, 90] },
  resolve: (entry, { style, name }) =>
    BitmapSpawner.create({
      kind: "bitmap",
      style,
      size: RangeUtils.toTuple(entry.size ?? BITMAP_DEFAULTS.imageSize, `${name}.size`),
      perColor: false,
      fit: "width",
      sources: WeightedListUtils.build(
        WeightedListUtils.entries(entry.src).map(({ value, weight }) => ({
          value: [ImageSource.from(value)],
          weight,
        })),
        `${name}.src`,
      ),
    }),
};
