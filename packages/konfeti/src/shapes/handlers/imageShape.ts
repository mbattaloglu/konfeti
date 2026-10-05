import { BITMAP_DEFAULTS } from "../../config/ShapeDefaults";
import type { ImageShapeOptions } from "../../types/shapes/ImageShapeOptions";
import type { ShapeHandler } from "../../types/shapes/ShapeHandler";
import { ImageSource } from "../../utils/ImageSource";
import { TintedImageSource } from "../../utils/TintedImageSource";
import { RangeUtils } from "../../utils/RangeUtils";
import { WeightedListUtils } from "../../utils/WeightedListUtils";
import { BitmapSpawner } from "../spawn/BitmapSpawner";
import { HandlerUtils } from "./HandlerUtils";

/**
 * Image Shape Handler.
 */
export const imageShape: ShapeHandler<ImageShapeOptions> = {
  type: "image",
  styleDefaults: { flip: false, rotation: [-20, 20], rotationSpeed: [-90, 90] },
  resolve: (entry, { style, pixelRatio, name }) => {
    const size = RangeUtils.toTuple(entry.size ?? BITMAP_DEFAULTS.imageSize, `${name}.size`);
    const tint = HandlerUtils.tintMode(entry.tint, `${name}.tint`);
    // a tinted copy is only needed as large as the image is drawn
    const raster = HandlerUtils.rasterSize(size, style, pixelRatio);

    return BitmapSpawner.create({
      kind: "bitmap",
      style,
      size,
      perColor: tint !== null,
      fit: "width",
      sources: WeightedListUtils.build(
        WeightedListUtils.entries(entry.src).map(({ value, weight }) => {
          const base = ImageSource.from(value);

          return {
            value:
              tint === null
                ? [base]
                : style.palette.colors.map(
                    (color) => new TintedImageSource(base, color, tint, raster),
                  ),
            weight,
          };
        }),
        `${name}.src`,
      ),
    });
  },
};
