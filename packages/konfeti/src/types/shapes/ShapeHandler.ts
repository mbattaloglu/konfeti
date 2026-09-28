import type { PaperStyle } from "../PaperStyle";
import type { ResolvedShape } from "../resolved/ResolvedShape";
import type { ResolvedStyle } from "../resolved/ResolvedStyle";
import type { ShapeStyle } from "../ShapeStyle";

/**
 * Context Passed to a Shape Handler while Resolving an Entry.
 */
export type ShapeHandlerContext = {
  /**
   * Resolved Common Style (paper base + per-type defaults + entry overrides).
   */
  readonly style: ResolvedStyle;
  /**
   * Paper Option Layers (paper handler reads its geometry from them).
   */
  readonly paperLayers: readonly (PaperStyle | undefined)[];
  /**
   * Canvas Pixel Ratio (bitmap raster resolution).
   */
  readonly pixelRatio: number;
  /**
   * Option Path for Error Messages (e.g. `shapes[2]`).
   */
  readonly name: string;
};

/**
 * Shape Handler.
 * Turns one `shapes[]` entry into a resolved, spawnable shape. Built-in handlers (`starShape`, `emojiShape` …)
 * are registered automatically by `konfeti`; with `konfeti/lite` register only the ones you use.
 */
export type ShapeHandler<TEntry extends { readonly type: string }> = {
  /**
   * Handled Shape Type.
   */
  readonly type: TEntry["type"];
  /**
   * Style Defaults for This Type (below `paper` and entry styles).
   */
  readonly styleDefaults?: ShapeStyle;
  /**
   * Resolve Entry.
   */
  readonly resolve: (entry: TEntry, context: ShapeHandlerContext) => ResolvedShape;
};

/**
 * Shape Handler of Any Entry Type.
 * What registries store: `resolve` accepts `never` so every concrete handler is assignable.
 */
export type AnyShapeHandler = {
  /**
   * Handled Shape Type.
   */
  readonly type: string;
  /**
   * Style Defaults for This Type.
   */
  readonly styleDefaults?: ShapeStyle;
  /**
   * Resolve Entry.
   */
  readonly resolve: (entry: never, context: ShapeHandlerContext) => ResolvedShape;
};
