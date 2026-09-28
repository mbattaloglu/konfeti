import type { ResolvedBitmapShape } from "../../types/resolved/ResolvedShape";
import { RangeUtils } from "../../utils/RangeUtils";
import { WeightedListUtils } from "../../utils/WeightedListUtils";
import { BitmapShape } from "../concretes/BitmapShape";

/**
 * Static Bitmap Shape Builder and Spawner (emoji, text, image).
 */
export class BitmapSpawner {
  /**
   * Attach Spawn Function to Resolved Bitmap Data.
   *
   * @param data - Resolved Bitmap Data
   * @returns Spawnable Resolved Bitmap Shape
   */
  public static create(data: Omit<ResolvedBitmapShape, "spawn">): ResolvedBitmapShape {
    const shape: ResolvedBitmapShape = {
      ...data,
      spawn: (particle, random, scale, colorIndex) => {
        const sources = WeightedListUtils.pick(shape.sources, random);
        const image = (shape.perColor ? sources[colorIndex % sources.length] : sources[0]) ?? null;
        const size = Math.max(0, RangeUtils.sample(shape.size, random)) * scale;
        const aspect = image?.isReady() ? image.getWidth() / image.getHeight() : 0;

        particle.shape = BitmapShape.getInstance();
        particle.image = image;

        if (shape.fit === "height" && aspect > 0) {
          // emoji/text: size is the font size, width follows the text length
          particle.height = size * (image?.getGlyphRatio() ?? 1);
          particle.width = particle.height * aspect;
        } else {
          particle.width = size;
          // height 0 = "derive from the image once it has loaded"
          particle.height = aspect > 0 ? size / aspect : 0;
        }
      },
    };

    return shape;
  }
}
