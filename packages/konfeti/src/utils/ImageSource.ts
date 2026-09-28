import type { ImageInput } from "../types/ImageInput";

/**
 * Drawable Image Wrapper.
 * Normalizes every `CanvasImageSource` flavour (and URLs) behind one readiness + size API. URL images are
 * cached, so the same URL is only downloaded once.
 */
export class ImageSource {
  /**
   * Loaded Image Cache by URL.
   */
  private static readonly urlCache = new Map<string, HTMLImageElement>();

  /**
   * Wrapped Image.
   */
  private readonly image: CanvasImageSource;

  /**
   * Raster Font Size for Glyph Bitmaps (`0` for regular images).
   */
  private readonly glyphSize: number;

  /**
   * Create Wrapper.
   *
   * @param image - Drawable Image
   * @param glyphSize - Font Size the Bitmap Was Rasterized At (glyph bitmaps only)
   */
  public constructor(image: CanvasImageSource, glyphSize = 0) {
    this.image = image;
    this.glyphSize = glyphSize;
  }

  /**
   * Return Bitmap Height per Font Size Unit.
   * A glyph bitmap is taller than its font size (line box + padding); drawing it at `size × ratio` makes the
   * glyph itself appear at `size`.
   *
   * @returns Height-to-Font-Size Ratio (`1` for regular images)
   */
  public getGlyphRatio(): number {
    return this.glyphSize > 0 ? this.getHeight() / this.glyphSize : 1;
  }

  /**
   * Create Wrapper from Image Input.
   *
   * @param input - URL or Drawable Image
   * @returns Image Source
   */
  public static from(input: ImageInput): ImageSource {
    return new ImageSource(typeof input === "string" ? ImageSource.loadUrl(input) : input);
  }

  /**
   * Return Cached Image Element for URL (starts loading on first call).
   *
   * @param url - Image URL
   * @returns Image Element
   */
  public static loadUrl(url: string): HTMLImageElement {
    let image = ImageSource.urlCache.get(url);

    if (!image) {
      image = new Image();
      image.decoding = "async";
      image.crossOrigin = "anonymous";
      image.src = url;
      ImageSource.urlCache.set(url, image);
    }

    return image;
  }

  /**
   * Return Drawable Image.
   *
   * @returns Wrapped Image
   */
  public getImage(): CanvasImageSource {
    return this.image;
  }

  /**
   * Check Readiness.
   *
   * @returns Ready to Draw Flag
   */
  public isReady(): boolean {
    return this.getWidth() > 0 && this.getHeight() > 0;
  }

  /**
   * Return Intrinsic Width (0 while loading).
   *
   * @returns Width in Source Pixels
   */
  public getWidth(): number {
    return ImageSource.measure(this.image, "width");
  }

  /**
   * Return Intrinsic Height (0 while loading).
   *
   * @returns Height in Source Pixels
   */
  public getHeight(): number {
    return ImageSource.measure(this.image, "height");
  }

  /**
   * Measure Image Dimension.
   *
   * @param image - Drawable Image
   * @param axis - Dimension
   * @returns Size in Source Pixels
   */
  private static measure(image: CanvasImageSource, axis: "width" | "height"): number {
    if (typeof HTMLImageElement !== "undefined" && image instanceof HTMLImageElement) {
      if (!image.complete) {
        return 0;
      }

      return axis === "width" ? image.naturalWidth : image.naturalHeight;
    }

    if (typeof HTMLVideoElement !== "undefined" && image instanceof HTMLVideoElement) {
      return axis === "width" ? image.videoWidth : image.videoHeight;
    }

    if ("displayWidth" in image) {
      return axis === "width" ? image.displayWidth : image.displayHeight;
    }

    const size = axis === "width" ? image.width : image.height;
    // SVGImageElement exposes animated lengths instead of numbers
    return typeof size === "number" ? size : size.baseVal.value;
  }
}
