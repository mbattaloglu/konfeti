import { CanvasFactory } from "./CanvasFactory";
import { ImageSource } from "./ImageSource";

/**
 * Static Text / Emoji Rasterizer.
 * Renders a glyph string once into a tightly cropped canvas and caches it by content, font, color and size.
 */
export class GlyphRasterizer {
  /**
   * Padding around Glyph Bounds in Raster Pixels.
   */
  private static readonly PADDING = 2;

  /**
   * Fallback Ascent Factor when Font Metrics Are Missing.
   */
  private static readonly FALLBACK_ASCENT = 0.9;

  /**
   * Fallback Descent Factor when Font Metrics Are Missing.
   */
  private static readonly FALLBACK_DESCENT = 0.25;

  /**
   * Zero-Size Placeholder Used when No Canvas Implementation Exists (never ready to draw).
   */
  private static readonly EMPTY: CanvasImageSource = {
    width: 0,
    height: 0,
  } as unknown as CanvasImageSource;

  /**
   * Raster Cache.
   */
  private static readonly cache = new Map<string, ImageSource>();

  /**
   * Rasterize Glyph String.
   *
   * @param text - Text or Emoji
   * @param fontFamily - CSS Font Family Stack
   * @param fontWeight - CSS Font Weight (empty for the font's default)
   * @param color - Fill Color
   * @param pixelSize - Raster Font Size in Device Pixels
   * @returns Cached Image Source
   */
  public static rasterize(
    text: string,
    fontFamily: string,
    fontWeight: string,
    color: string,
    pixelSize: number,
  ): ImageSource {
    const size = Math.max(1, Math.round(pixelSize));
    // CSS font shorthand order is "<weight> <size> <family>"; any other order is silently rejected
    const font = `${fontWeight} ${String(size)}px ${fontFamily}`.trim();
    const key = `${text}\u0000${font}\u0000${color}`;
    const cached = GlyphRasterizer.cache.get(key);

    if (cached) {
      return cached;
    }

    const source = new ImageSource(GlyphRasterizer.render(text, font, color, size), size);
    GlyphRasterizer.cache.set(key, source);
    return source;
  }

  /**
   * Render Glyph into New Canvas.
   *
   * @param text - Text or Emoji
   * @param font - Full CSS Font
   * @param color - Fill Color
   * @param size - Font Size in Pixels
   * @returns Canvas with the Glyph
   */
  private static render(
    text: string,
    font: string,
    color: string,
    size: number,
  ): CanvasImageSource {
    const scratch = CanvasFactory.create(1, 1);

    if (scratch === null) {
      return GlyphRasterizer.EMPTY;
    }

    const { canvas, context } = scratch;

    context.font = font;
    const metrics = context.measureText(text);
    // font-level (not glyph-level) vertical metrics keep every word at the same visual font size
    const left = metrics.actualBoundingBoxLeft;
    const right = metrics.actualBoundingBoxRight || metrics.width;
    const ascent = GlyphRasterizer.metric(
      metrics.fontBoundingBoxAscent,
      size * GlyphRasterizer.FALLBACK_ASCENT,
    );
    const descent = GlyphRasterizer.metric(
      metrics.fontBoundingBoxDescent,
      size * GlyphRasterizer.FALLBACK_DESCENT,
    );
    const padding = GlyphRasterizer.PADDING;

    canvas.width = Math.max(1, Math.ceil(left + right + padding * 2));
    canvas.height = Math.max(1, Math.ceil(ascent + descent + padding * 2));

    // resizing resets the context state, so configure it afterwards
    context.font = font;
    context.fillStyle = color;
    context.textBaseline = "alphabetic";
    context.fillText(text, padding + left, padding + ascent);

    return canvas;
  }

  /**
   * Return Metric or Fallback when Missing.
   *
   * @param value - Measured Metric (may be undefined in older browsers)
   * @param fallback - Fallback Value
   * @returns Metric
   */
  private static metric(value: number | undefined, fallback: number): number {
    return value !== undefined && Number.isFinite(value) && value > 0 ? value : fallback;
  }
}
