import type { OneOrMany } from "../OneOrMany";
import type { Range } from "../Range";
import type { Pixels } from "../Units";
import type { ShapeEntryBase } from "./ShapeEntryBase";

/**
 * Emoji Shape Entry.
 * Each emoji is rendered once into a cached bitmap and then drawn like a sprite. Color and stroke keys are
 * ignored.
 *
 * @example
 * ```ts
 * shapes: [{ type: "emoji", emoji: ["🎉", "🥳", { value: "✨", weight: 3 }], size: [20, 32] }]
 * ```
 */
export type EmojiShapeOptions = ShapeEntryBase & {
  /**
   * Shape Type.
   */
  readonly type: "emoji";
  /**
   * Emoji Character(s).
   * Any grapheme works, including ZWJ sequences and flags.
   */
  readonly emoji: OneOrMany<string>;
  /**
   * Emoji Size (font size).
   *
   * @defaultValue `[18, 28]`
   */
  readonly size?: Range<Pixels>;
  /**
   * Font Family Stack.
   *
   * @defaultValue `'"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'`
   */
  readonly fontFamily?: string;
};
