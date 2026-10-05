import type { ImageInput } from "../ImageInput";
import type { OneOrMany } from "../OneOrMany";
import type { Range } from "../Range";
import type { TintMode } from "../TintMode";
import type { Pixels } from "../Units";
import type { ShapeEntryBase } from "./ShapeEntryBase";

/**
 * Image Shape Entry.
 * Draws images (logos, coins, stickers). Aspect ratio is preserved; `size` is the width. Colors only apply with
 * `tint`; stroke keys are ignored.
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
  /**
   * Tint.
   * Recolors the image with the particle colors (`colors`, inherited from `paper.colors` when the entry sets none):
   * every particle picks a color the way a paper piece does and draws a copy of the image in that color. `true` is
   * `"multiply"` (keeps the shading, so white or grey artwork takes the colors best); `"fill"` gives flat silhouettes.
   *
   * @defaultValue `false` (the image keeps its own colors)
   * @example
   * ```ts
   * shapes: [{ type: "image", src: "/coin-white.png", tint: true, colors: ["#ffd700", "#ff5e7e"] }]
   * shapes: [{ type: "image", src: "/logo.png", tint: "fill" }] // silhouettes in the paper colors
   * ```
   * @remarks Each color is painted once per image when it has loaded (at the largest size it is drawn, 256 px at most); drawing costs the same as without a tint.
   * @see {@link TintMode}
   */
  readonly tint?: boolean | TintMode;
};
