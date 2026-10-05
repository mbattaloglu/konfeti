import type { ImageInput } from "../ImageInput";
import type { Range } from "../Range";
import type { SpriteFrames } from "../SpriteFrames";
import type { TintMode } from "../TintMode";
import type { Pixels } from "../Units";
import type { ShapeEntryBase } from "./ShapeEntryBase";

/**
 * Animated Spritesheet Shape Entry.
 * Plays frames from one image, e.g. a spinning coin. `size` is the rendered frame width.
 *
 * @example
 * ```ts
 * shapes: [{
 *   type: "spritesheet",
 *   src: "/coin-spin.png",
 *   frames: { cols: 8, rows: 1 },
 *   fps: [12, 18],
 *   flip: false,
 * }]
 * ```
 */
export type SpriteSheetShapeOptions = ShapeEntryBase & {
  /**
   * Shape Type.
   */
  readonly type: "spritesheet";
  /**
   * Spritesheet Image.
   * A URL, any canvas image source, or inline `<svg>` markup (give the `<svg>` a `width` and `height`).
   */
  readonly src: ImageInput;
  /**
   * Frame Layout.
   *
   * @see {@link SpriteFrames}
   */
  readonly frames: SpriteFrames;
  /**
   * Playback Speed in Frames per Second.
   *
   * @defaultValue `12`
   */
  readonly fps?: Range;
  /**
   * Loop Playback.
   * When `false`, the animation holds its last frame.
   *
   * @defaultValue `true`
   */
  readonly loop?: boolean;
  /**
   * Random Start Frame.
   * Desynchronizes particles so they don't all animate in lockstep.
   *
   * @defaultValue `true`
   */
  readonly randomStartFrame?: boolean;
  /**
   * Rendered Frame Width.
   *
   * @defaultValue `[16, 28]`
   */
  readonly size?: Range<Pixels>;
  /**
   * Tint.
   * Recolors the sheet with the particle colors (`colors`, inherited from `paper.colors` when the entry sets none):
   * every particle picks a color the way a paper piece does and draws a copy of the sheet in that color. `true` is
   * `"multiply"` (keeps the shading, so white or grey artwork takes the colors best); `"fill"` gives flat silhouettes.
   *
   * @defaultValue `false` (the sheet keeps its own colors)
   * @example
   * ```ts
   * shapes: [{ type: "spritesheet", src: "/coin-white.png", frames: { cols: 8, rows: 1 }, tint: true, colors: ["#ffd700", "#ff5e7e"] }]
   * shapes: [{ type: "spritesheet", src: "/logo.png", frames: { cols: 8, rows: 1 }, tint: "fill" }] // silhouettes in the paper colors
   * ```
   * @remarks Each color is painted once per sheet when it has loaded (at its own size, so the frames stay in place); drawing costs the same as without a tint.
   * @see {@link TintMode}
   */
  readonly tint?: boolean | TintMode;
};
