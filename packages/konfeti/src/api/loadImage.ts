import { ImageSource } from "../utils/ImageSource";

/**
 * Preload Image by URL.
 * Uses the same cache as `image` / `spritesheet` shapes, so firing afterwards draws immediately.
 *
 * @param url - Image URL
 * @returns Promise Resolving with the Loaded Image
 * @example
 * ```ts
 * await loadImage("/coin.png");
 * Konfeti.fire({ shapes: [{ type: "image", src: "/coin.png" }] });
 * ```
 */
export async function loadImage(url: string): Promise<HTMLImageElement> {
  const image = ImageSource.loadUrl(url);

  if (!image.complete || image.naturalWidth === 0) {
    await new Promise<void>((resolve, reject) => {
      image.addEventListener(
        "load",
        () => {
          resolve();
        },
        { once: true },
      );
      image.addEventListener(
        "error",
        () => {
          reject(new Error(`konfeti: failed to load image "${url}"`));
        },
        { once: true },
      );
    });
  }

  return image;
}
