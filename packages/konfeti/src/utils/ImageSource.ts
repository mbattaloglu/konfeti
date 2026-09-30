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
   * Inline SVG Markup Pattern (optionally preceded by an XML declaration or whitespace).
   */
  private static readonly SVG_MARKUP = /^\s*(<\?xml[^>]*>\s*)?<svg[\s>]/i;

  /**
   * URL Loader Used without the DOM (installed by the worker entry), or Null.
   */
  private static urlLoader: ((url: string) => ImageSource) | null = null;

  /**
   * Wrapped Image (replaced once for bitmaps loaded asynchronously).
   */
  private image: CanvasImageSource;

  /**
   * Raster Font Size for Glyph Bitmaps (`0` for regular images).
   */
  private readonly glyphSize: number;

  /**
   * Load Failure Flag (set by asynchronous loaders).
   */
  private _hasFailed = false;

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
    if (typeof input !== "string") {
      return new ImageSource(input);
    }

    // only the worker entry installs a loader; the main thread always uses <img>
    if (ImageSource.urlLoader) {
      return ImageSource.urlLoader(input);
    }

    return new ImageSource(ImageSource.loadUrl(input));
  }

  /**
   * Check Whether a String Is Inline SVG Markup (rather than a URL).
   *
   * @param value - URL or Markup
   * @returns Markup Flag
   */
  public static isSvgMarkup(value: string): boolean {
    return ImageSource.SVG_MARKUP.test(value);
  }

  /**
   * Turn Inline SVG Markup into a `data:` URL (URLs pass through unchanged).
   *
   * @param value - URL or `<svg>` Markup
   * @returns Loadable URL
   */
  public static toUrl(value: string): string {
    return ImageSource.isSvgMarkup(value)
      ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(value.trim())}`
      : value;
  }

  /**
   * Install URL Loader for Environments without `Image` (workers).
   * Kept out of the main bundle, so only the worker script pays for it.
   *
   * @param loader - Loader Returning a (possibly pending) Image Source
   */
  public static setUrlLoader(loader: (url: string) => ImageSource): void {
    ImageSource.urlLoader = loader;
  }

  /**
   * Replace Wrapped Image (async loaders swap in the finished bitmap).
   *
   * @param image - Drawable Image
   */
  public setImage(image: CanvasImageSource): void {
    this.image = image;
  }

  /**
   * Return Cached Image Element for URL (starts loading on first call).
   *
   * @param url - Image URL or Inline `<svg>` Markup
   * @returns Image Element
   */
  public static loadUrl(url: string): HTMLImageElement {
    // inline <svg> markup loads like any other image once it is a data: URL
    url = ImageSource.toUrl(url);
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
   * Check Whether the Image Failed to Load (it will never become ready).
   *
   * @returns Failed Flag
   */
  public hasFailed(): boolean {
    if (this._hasFailed) {
      return true;
    }

    // a finished <img> without pixels is a broken one
    return (
      typeof HTMLImageElement !== "undefined" &&
      this.image instanceof HTMLImageElement &&
      this.image.complete &&
      this.image.naturalWidth === 0
    );
  }

  /**
   * Mark the Image as Failed (asynchronous loaders call it when a download or decode fails).
   */
  public markFailed(): void {
    this._hasFailed = true;
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
