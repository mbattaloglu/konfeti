import { BITMAP_DEFAULTS } from "../../config/ShapeDefaults";
import type { RangeTuple } from "../../types/Range";
import type { ResolvedStyle } from "../../types/resolved/ResolvedStyle";
import { MathUtils } from "../../utils/MathUtils";

/**
 * Static Helpers Shared by Built-in Shape Handlers.
 */
export class HandlerUtils {
  /**
   * Calculate Raster Font Size for Crisp Glyph Bitmaps.
   *
   * @param size - Size Range
   * @param style - Resolved Style
   * @param pixelRatio - Canvas Pixel Ratio
   * @returns Raster Size in Device Pixels
   */
  public static rasterSize(size: RangeTuple, style: ResolvedStyle, pixelRatio: number): number {
    const growth = Math.max(1, style.scaleOverLife?.to ?? 1);
    const largest =
      size[1] *
      Math.max(style.scale[1], 0) *
      growth *
      pixelRatio *
      BITMAP_DEFAULTS.rasterOversample;
    return MathUtils.clamp(largest, 1, BITMAP_DEFAULTS.maxRasterSize);
  }

  /**
   * List Integers in Inclusive Range.
   *
   * @param range - Integer Tuple
   * @returns Integer List
   */
  public static intSteps(range: RangeTuple): number[] {
    const steps: number[] = [];

    for (let value = range[0]; value <= range[1]; value++) {
      steps.push(value);
    }

    return steps;
  }
}
