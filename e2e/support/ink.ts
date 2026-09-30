import type { Page } from "@playwright/test";

/**
 * Where the Drawn Particles Are in a Screenshot.
 */
export type InkCenter = {
  /**
   * Mean X of the Drawn Pixels (CSS px from the screenshot's left edge).
   */
  readonly x: number;
  /**
   * Mean Y of the Drawn Pixels (CSS px from the screenshot's top edge).
   */
  readonly y: number;
  /**
   * Number of Drawn Pixels.
   */
  readonly count: number;
  /**
   * Leftmost Drawn Pixel.
   */
  readonly left: number;
  /**
   * Rightmost Drawn Pixel.
   */
  readonly right: number;
  /**
   * Topmost Drawn Pixel.
   */
  readonly top: number;
  /**
   * Lowest Drawn Pixel.
   */
  readonly bottom: number;
  /**
   * Mean Red of the Drawn Pixels (0–255).
   */
  readonly red: number;
  /**
   * Mean Blue of the Drawn Pixels (0–255).
   */
  readonly blue: number;
};

/**
 * Find Where Everything Drawn on a White Page Is.
 * The PNG is decoded in the page (the test runner has no image decoder); any clearly colored pixel counts as
 * confetti, since every default color has a strong channel far from white.
 *
 * @param page - Page Used for Decoding
 * @param png - Screenshot
 * @returns Center, Bounds, Count and Mean Color of the Drawn Pixels
 */
export async function inkCenter(page: Page, png: Buffer): Promise<InkCenter> {
  return page.evaluate(async (base64) => {
    const response = await fetch(`data:image/png;base64,${base64}`);
    const bitmap = await createImageBitmap(await response.blob());
    const context = new OffscreenCanvas(bitmap.width, bitmap.height).getContext("2d");

    if (context === null) {
      throw new Error("no 2d context");
    }

    context.drawImage(bitmap, 0, 0);
    const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height);
    let sumX = 0;
    let sumY = 0;
    let sumRed = 0;
    let sumBlue = 0;
    let count = 0;
    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;

    for (let index = 0; index < data.length; index += 4) {
      const darkest = Math.min(data[index] ?? 255, data[index + 1] ?? 255, data[index + 2] ?? 255);

      if (darkest < 200) {
        const pixel = index / 4;
        const x = pixel % bitmap.width;
        const y = Math.floor(pixel / bitmap.width);
        sumX += x;
        sumY += y;
        sumRed += data[index] ?? 0;
        sumBlue += data[index + 2] ?? 0;
        count++;
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }

    return {
      x: sumX / Math.max(count, 1),
      y: sumY / Math.max(count, 1),
      count,
      left,
      right,
      top,
      bottom,
      red: sumRed / Math.max(count, 1),
      blue: sumBlue / Math.max(count, 1),
    };
  }, png.toString("base64"));
}
