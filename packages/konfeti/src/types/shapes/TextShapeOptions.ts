import type { OneOrMany } from "../OneOrMany";
import type { Range } from "../Range";
import type { Pixels } from "../Units";
import type { ShapeEntryBase } from "./ShapeEntryBase";

/**
 * Text Shape Entry.
 * Words or letters filled with the particle colors (one cached bitmap per text × color).
 *
 * @example
 * ```ts
 * shapes: [{ type: "text", text: ["YAY", "WOW"], fontWeight: 900, colors: ["#ff0a54", "#00c2ff"] }]
 * ```
 */
export type TextShapeOptions = ShapeEntryBase & {
  /**
   * Shape Type.
   */
  readonly type: "text";
  /**
   * Text Content(s).
   */
  readonly text: OneOrMany<string>;
  /**
   * Font Size.
   *
   * @defaultValue `[14, 22]`
   */
  readonly size?: Range<Pixels>;
  /**
   * Font Family.
   * Make sure web fonts are loaded before firing (`document.fonts.ready`).
   *
   * @defaultValue `"system-ui, sans-serif"`
   */
  readonly fontFamily?: string;
  /**
   * Font Weight.
   *
   * @defaultValue `700`
   */
  readonly fontWeight?: number | "normal" | "bold";
};
