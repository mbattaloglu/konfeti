import type { ImageInput } from "../ImageInput";
import type { Pixels } from "../Units";
import type { FormationBase } from "./FormationBase";

/**
 * Formation Traced from an Image.
 * The opaque pixels of an image (a logo, an icon, a badge) become the shape, centered on the burst's
 * `origin`.
 *
 * @example
 * ```ts
 * await loadImage("/logo.png"); // optional: the burst waits for the image anyway
 * Konfeti.fire({ formation: { image: "/logo.png", width: 240 } });
 * ```
 */
export type ImageFormation = FormationBase & {
  /**
   * Image.
   * A URL, inline `<svg>` markup, or any drawable image. Pixels at least half opaque belong to the shape.
   * The burst waits until the image has loaded; if it cannot be loaded or read, the burst ends without
   * particles.
   *
   * @example
   * ```ts
   * formation: { image: "/badge.png" }
   * formation: { image: '<svg width="100" height="100" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5"/></svg>' }
   * ```
   * @remarks The pixels are read back from a canvas, so an image from another origin needs CORS headers.
   * Inline SVG markup is not supported by worker instances (browsers cannot decode SVG inside a worker).
   */
  readonly image: ImageInput;
  /**
   * Width.
   * Size of the shape on screen before `fit` scales it down; the height follows the image's aspect ratio.
   *
   * @defaultValue the image's own width
   * @remarks Unit: pixels (CSS px). Must be positive.
   */
  readonly width?: Pixels;
  /**
   * Image Colors.
   * Paint each particle with the color of the pixel it sits on, so a colorful logo stays recognizable.
   * `false` keeps the shapes' own colors (the image then only gives the outline).
   *
   * @defaultValue `true`
   * @remarks Only affects shapes drawn in a color (paper, vector shapes); emoji and images keep their look.
   * A shape `gradient` takes precedence, and `colorOverLife` does not apply to image-colored particles.
   */
  readonly imageColors?: boolean;
  /**
   * Not Used by Image Formations (set either `text` or `image`).
   */
  readonly text?: never;
  /**
   * Not Used by Image Formations.
   */
  readonly font?: never;
};
