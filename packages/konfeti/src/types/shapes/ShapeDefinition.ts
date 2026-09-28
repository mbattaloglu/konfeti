import type { Range } from "../Range";
import type { Pixels } from "../Units";
import type { CustomShapeParticle } from "./CustomShapeParticle";

/**
 * Path-Based Custom Shape.
 * Return a path once per burst; the library fills, strokes, shades, flips and glints it like any built-in
 * vector shape (gradients, shine and stroke all work).
 *
 * @example
 * ```ts
 * defineShape("diamond", {
 *   viewBox: [24, 24],
 *   path: ({ sharpness = 0.5 }) => `M12 0 L${24 - sharpness * 12} 12 L12 24 L${sharpness * 12} 12 Z`,
 * });
 * ```
 */
export type PathShapeDefinition<TOptions extends object> = {
  /**
   * Build the Path from Entry Options.
   * An SVG `d` string or a `Path2D`, in `viewBox` coordinates.
   */
  readonly path: (options: Readonly<TOptions>) => string | Path2D;
  /**
   * Path Coordinate Box as `[width, height]`.
   *
   * @defaultValue `[24, 24]`
   */
  readonly viewBox?: readonly [width: number, height: number];
  /**
   * Size When the Entry Sets None.
   *
   * @defaultValue `[12, 18]`
   */
  readonly defaultSize?: Range<Pixels>;
};

/**
 * Draw-Based Custom Shape.
 * Full control: draw anything with the 2D context. The library has already applied position, rotation,
 * flip, skew, scale and opacity — draw centered at `0, 0`.
 *
 * @example
 * ```ts
 * defineShape("ring", {
 *   draw: (ctx, p, { thickness = 3 }) => {
 *     ctx.lineWidth = thickness;
 *     ctx.strokeStyle = p.fill;
 *     ctx.beginPath();
 *     ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
 *     ctx.stroke();
 *   },
 * });
 * ```
 * @remarks Runs for every particle every frame — avoid allocations inside `draw`.
 */
export type DrawShapeDefinition<TOptions extends object> = {
  /**
   * Draw One Particle.
   */
  readonly draw: (
    context: CanvasRenderingContext2D,
    particle: CustomShapeParticle,
    options: Readonly<TOptions>,
  ) => void;
  /**
   * Height-to-Width Ratio of the Box.
   *
   * @defaultValue `1`
   */
  readonly aspectRatio?: number;
  /**
   * Size When the Entry Sets None.
   *
   * @defaultValue `[12, 18]`
   */
  readonly defaultSize?: Range<Pixels>;
};

/**
 * Custom Shape Definition (path- or draw-based).
 */
export type ShapeDefinition<TOptions extends object> =
  PathShapeDefinition<TOptions> | DrawShapeDefinition<TOptions>;
