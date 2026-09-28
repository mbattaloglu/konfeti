import type { CustomShapeOptions } from "./CustomShapeOptions";
import type { EmojiShapeOptions } from "./EmojiShapeOptions";
import type { HeartShapeOptions } from "./HeartShapeOptions";
import type { ImageShapeOptions } from "./ImageShapeOptions";
import type { PaperShapeOptions } from "./PaperShapeOptions";
import type { PathShapeOptions } from "./PathShapeOptions";
import type { PolygonShapeOptions } from "./PolygonShapeOptions";
import type { RibbonShapeOptions } from "./RibbonShapeOptions";
import type { SpriteSheetShapeOptions } from "./SpriteSheetShapeOptions";
import type { StarShapeOptions } from "./StarShapeOptions";
import type { TextShapeOptions } from "./TextShapeOptions";
import type { TriangleShapeOptions } from "./TriangleShapeOptions";

/**
 * Built-in `shapes` Entry.
 */
export type BuiltinShapeOptions =
  | PaperShapeOptions
  | StarShapeOptions
  | TriangleShapeOptions
  | PolygonShapeOptions
  | HeartShapeOptions
  | RibbonShapeOptions
  | PathShapeOptions
  | EmojiShapeOptions
  | TextShapeOptions
  | ImageShapeOptions
  | SpriteSheetShapeOptions;

/**
 * Built-in Shape Type Name.
 */
export type BuiltinShapeType = BuiltinShapeOptions["type"];

/**
 * Any `shapes` Entry (built-in or registered with `defineShape()`).
 * Discriminated by `type`; autocomplete shows the options of the chosen type only.
 */
export type ShapeOptions = [CustomShapeOptions] extends [never]
  ? BuiltinShapeOptions
  : BuiltinShapeOptions | CustomShapeOptions;

/**
 * Shape Type Name.
 */
export type ShapeType = ShapeOptions["type"];
