import { ImageSource } from "../utils/ImageSource";

/**
 * Static URL Image Loader for Workers.
 * Workers have no `Image` element, so URLs are fetched and decoded with `createImageBitmap`.
 */
export class BitmapLoader {
  /**
   * Zero-Size Placeholder Shown until the Bitmap Arrives.
   */
  private static readonly PENDING = { width: 0, height: 0 } as unknown as CanvasImageSource;

  /**
   * Loaded (or Loading) Sources by URL.
   */
  private static readonly cache = new Map<string, ImageSource>();

  /**
   * Load URL as ImageBitmap.
   * The source is not ready until the bitmap arrives; failed loads simply never become ready.
   *
   * @param url - Absolute Image URL
   * @returns Cached Image Source
   */
  public static load(url: string): ImageSource {
    const cached = BitmapLoader.cache.get(url);

    if (cached) {
      return cached;
    }

    const source = new ImageSource(BitmapLoader.PENDING);
    BitmapLoader.cache.set(url, source);
    fetch(url)
      .then(async (response) => createImageBitmap(await response.blob()))
      .then((bitmap) => {
        source.setImage(bitmap);
      })
      .catch(() => undefined);

    return source;
  }
}
