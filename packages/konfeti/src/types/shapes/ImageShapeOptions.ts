import type { ImageInput } from "../ImageInput";
import type { OneOrMany } from "../OneOrMany";
import type { Range } from "../Range";
import type { Pixels } from "../Units";
import type { ShapeEntryBase } from "./ShapeEntryBase";

/**
 * Image Shape Entry.
 * Draws images (logos, coins, stickers). Aspect ratio is preserved; `size` is the width. Color and stroke
 * keys are ignored.
 *
 * @example
 * ```ts
 * shapes: [{ type: "image", src: ["/coin.png", "/gem.png"], size: [20, 30], flip: false }]
 * ```
 */
export type ImageShapeOptions = ShapeEntryBase & {
  /**
   * Image Source(s).
   * URLs are loaded automatically; particles become visible once loaded. Use `loadImage()` to preload. A string
   * starting with `<svg` is used as inline SVG markup — give the `<svg>` a `width` and `height` so it has a size.
   *
   * @example
   * ```ts
   * { type: "image", src: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="10" fill="gold"/></svg>' }
   * ```
   * @remarks Inline SVG is not supported by worker instances (browsers cannot decode SVG inside a worker).
   */
  readonly src: OneOrMany<ImageInput>;
  /**
   * Shape Type.
   */
  readonly type: "image";
  /**
   * Rendered Width.
   *
   * @defaultValue `[16, 28]`
   */
  readonly size?: Range<Pixels>;
};
