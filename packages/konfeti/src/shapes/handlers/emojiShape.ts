import { BITMAP_DEFAULTS } from "../../config/ShapeDefaults";
import type { EmojiShapeOptions } from "../../types/shapes/EmojiShapeOptions";
import type { ShapeHandler } from "../../types/shapes/ShapeHandler";
import { GlyphRasterizer } from "../../utils/GlyphRasterizer";
import { RangeUtils } from "../../utils/RangeUtils";
import { WeightedListUtils } from "../../utils/WeightedListUtils";
import { BitmapSpawner } from "../spawn/BitmapSpawner";
import { HandlerUtils } from "./HandlerUtils";

/**
 * Emoji Shape Handler.
 */
export const emojiShape: ShapeHandler<EmojiShapeOptions> = {
  type: "emoji",
  styleDefaults: { flip: false, rotation: [-20, 20], rotationSpeed: [-90, 90] },
  resolve: (entry, { style, pixelRatio, name }) => {
    const size = RangeUtils.toTuple(entry.size ?? BITMAP_DEFAULTS.emojiSize, `${name}.size`);
    const raster = HandlerUtils.rasterSize(size, style, pixelRatio);
    const font = entry.fontFamily ?? BITMAP_DEFAULTS.emojiFontFamily;

    return BitmapSpawner.create({
      kind: "bitmap",
      style,
      size,
      perColor: false,
      fit: "height",
      sources: WeightedListUtils.build(
        WeightedListUtils.entries(entry.emoji).map(({ value, weight }) => ({
          value: [GlyphRasterizer.rasterize(value, font, "", "#000", raster)],
          weight,
        })),
        `${name}.emoji`,
      ),
    });
  },
};
