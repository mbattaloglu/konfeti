import type { PaperForm } from "../PaperForm";
import type { RangeTuple } from "../Range";
import type { FrameRect } from "../FrameRect";
import type { Particle } from "../../particles/Particle";
import type { ImageSource } from "../../utils/ImageSource";
import type { Random } from "../../utils/Random";
import type { DrawShapeDefinition } from "../shapes/ShapeDefinition";
import type { ResolvedStyle } from "./ResolvedStyle";
import type { WeightedList } from "./WeightedList";

/**
 * Unit Vector Path Variant.
 * The path is transformed by `scale` and `offset` so that it fits a 1×1 box centered at the origin.
 */
export type VectorVariant = {
  /**
   * Path Geometry.
   */
  readonly path: Path2D;
  /**
   * Path-to-Unit Scale.
   */
  readonly scale: number;
  /**
   * Horizontal Offset in Path Units (applied before scaling).
   */
  readonly offsetX: number;
  /**
   * Vertical Offset in Path Units (applied before scaling).
   */
  readonly offsetY: number;
  /**
   * Height-to-Width Ratio of the Unit Box.
   */
  readonly aspect: number;
};

/**
 * Spritesheet Frame Layout (resolved).
 */
export type ResolvedFrames =
  | { readonly kind: "grid"; readonly cols: number; readonly rows: number; readonly count: number }
  | { readonly kind: "rects"; readonly rects: readonly FrameRect[] };

/**
 * Per-Particle Spawn Function (bound to its resolved shape).
 */
export type ShapeSpawner = (
  particle: Particle,
  random: Random,
  scale: number,
  colorIndex: number,
) => void;

/**
 * Resolved Paper Shape.
 */
export type ResolvedPaperShape = {
  /**
   * Shape Kind.
   */
  readonly kind: "paper";
  /**
   * Common Style.
   */
  readonly style: ResolvedStyle;
  /**
   * Spawn Function.
   */
  readonly spawn: ShapeSpawner;
  /**
   * Weighted Form List.
   */
  readonly forms: WeightedList<PaperForm>;
  /**
   * Width Range.
   */
  readonly width: RangeTuple;
  /**
   * Height Range.
   */
  readonly height: RangeTuple;
  /**
   * Aspect Ratio Range (overrides height when set).
   */
  readonly aspectRatio: RangeTuple | null;
  /**
   * Corner Radius Ranges in `tl, tr, br, bl` Order.
   */
  readonly cornerRadius: readonly [RangeTuple, RangeTuple, RangeTuple, RangeTuple];
  /**
   * Skew Range in Degrees.
   */
  readonly skew: RangeTuple;
};

/**
 * Resolved Vector Shape (star, triangle, polygon, heart, ribbon, path).
 */
export type ResolvedVectorShape = {
  /**
   * Shape Kind.
   */
  readonly kind: "vector";
  /**
   * Common Style.
   */
  readonly style: ResolvedStyle;
  /**
   * Spawn Function.
   */
  readonly spawn: ShapeSpawner;
  /**
   * Size Range (unit box width).
   */
  readonly size: RangeTuple;
  /**
   * Weighted Path Variant List.
   */
  readonly variants: WeightedList<VectorVariant>;
};

/**
 * Resolved Bitmap Shape (emoji, text, image).
 */
export type ResolvedBitmapShape = {
  /**
   * Shape Kind.
   */
  readonly kind: "bitmap";
  /**
   * Common Style.
   */
  readonly style: ResolvedStyle;
  /**
   * Spawn Function.
   */
  readonly spawn: ShapeSpawner;
  /**
   * Size Range (see `fit`).
   */
  readonly size: RangeTuple;
  /**
   * Weighted Source List (`perColor` sources are laid out `index × colorCount + colorIndex`).
   */
  readonly sources: WeightedList<readonly ImageSource[]>;
  /**
   * Per-Palette-Color Sources Flag (text).
   */
  readonly perColor: boolean;
  /**
   * Axis Matched by `size` (`"height"` = font size for emoji/text, `"width"` for images).
   */
  readonly fit: "width" | "height";
};

/**
 * Resolved Spritesheet Shape.
 */
export type ResolvedSpriteShape = {
  /**
   * Shape Kind.
   */
  readonly kind: "sprite";
  /**
   * Common Style.
   */
  readonly style: ResolvedStyle;
  /**
   * Spawn Function.
   */
  readonly spawn: ShapeSpawner;
  /**
   * Size Range (drawn frame width).
   */
  readonly size: RangeTuple;
  /**
   * Spritesheet Image.
   */
  readonly source: ImageSource;
  /**
   * Frame Layout.
   */
  readonly frames: ResolvedFrames;
  /**
   * Frames per Second Range.
   */
  readonly fps: RangeTuple;
  /**
   * Loop Playback Flag.
   */
  readonly loop: boolean;
  /**
   * Random Start Frame Flag.
   */
  readonly randomStartFrame: boolean;
};

/**
 * Resolved Draw-Based Custom Shape.
 */
export type ResolvedCustomShape = {
  /**
   * Shape Kind.
   */
  readonly kind: "custom";
  /**
   * Common Style.
   */
  readonly style: ResolvedStyle;
  /**
   * Spawn Function.
   */
  readonly spawn: ShapeSpawner;
  /**
   * Size Range (box width).
   */
  readonly size: RangeTuple;
  /**
   * Height-to-Width Ratio.
   */
  readonly aspect: number;
  /**
   * User Draw Function.
   */
  readonly draw: DrawShapeDefinition<object>["draw"];
  /**
   * Entry Options Passed to `draw`.
   */
  readonly options: object;
};

/**
 * Any Resolved Shape.
 */
export type ResolvedShape =
  | ResolvedPaperShape
  | ResolvedVectorShape
  | ResolvedBitmapShape
  | ResolvedSpriteShape
  | ResolvedCustomShape;
