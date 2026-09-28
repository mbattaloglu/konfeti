import type { ImageInput } from "../ImageInput";
import type { Range } from "../Range";
import type { SpriteFrames } from "../SpriteFrames";
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
};
