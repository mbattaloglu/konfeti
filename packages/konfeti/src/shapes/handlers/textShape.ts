import { BITMAP_DEFAULTS } from "../../config/ShapeDefaults";
import type { ShapeHandler } from "../../types/shapes/ShapeHandler";
import type { TextShapeOptions } from "../../types/shapes/TextShapeOptions";
import { GlyphRasterizer } from "../../utils/GlyphRasterizer";
import { RangeUtils } from "../../utils/RangeUtils";
import { WeightedListUtils } from "../../utils/WeightedListUtils";
import { BitmapSpawner } from "../spawn/BitmapSpawner";
import { HandlerUtils } from "./HandlerUtils";

/**
 * Text Shape Handler (one raster per text × palette color).
 */
export const textShape: ShapeHandler<TextShapeOptions> = {
  type: "text",
  styleDefaults: { flip: false, rotation: [-20, 20], rotationSpeed: [-90, 90] },
  resolve: (entry, { style, pixelRatio, name }) => {
    const size = RangeUtils.toTuple(entry.size ?? BITMAP_DEFAULTS.textSize, `${name}.size`);
    const raster = HandlerUtils.rasterSize(size, style, pixelRatio);
    const fontFamily = entry.fontFamily ?? BITMAP_DEFAULTS.textFontFamily;
    const fontWeight = String(entry.fontWeight ?? BITMAP_DEFAULTS.textFontWeight);

    return BitmapSpawner.create({
      kind: "bitmap",
      style,
      size,
      perColor: true,
      fit: "height",
      sources: WeightedListUtils.build(
        WeightedListUtils.entries(entry.text).map(({ value, weight }) => ({
          value: style.palette.colors.map((color) =>
            GlyphRasterizer.rasterize(value, fontFamily, fontWeight, color, raster),
          ),
          weight,
        })),
        `${name}.text`,
      ),
    });
  },
};
