import type { VectorVariant } from "../types/resolved/ResolvedShape";
import { MathUtils } from "./MathUtils";

/**
 * Static Unit Vector Path Builders.
 * Every builder returns a path that fits a box of width 1 centered at the origin.
 */
export class VectorPaths {
  /**
   * Unit Radius.
   */
  private static readonly RADIUS = 0.5;

  /**
   * Ribbon Curl Amplitude (unit box).
   */
  private static readonly RIBBON_AMPLITUDE = 0.16;

  /**
   * Ribbon Outline Samples per Side.
   */
  private static readonly RIBBON_SAMPLES = 24;

  /**
   * Built Path Cache.
   */
  private static readonly cache = new Map<string, VectorVariant>();

  /**
   * Build Star.
   *
   * @param points - Number of Points
   * @param innerRatio - Inner Radius Ratio
   * @returns Unit Variant
   */
  public static star(points: number, innerRatio: number): VectorVariant {
    return VectorPaths.cached(`star:${points}:${innerRatio}`, () => {
      const path = new Path2D();
      const steps = points * 2;

      for (let index = 0; index < steps; index++) {
        const radius = index % 2 === 0 ? VectorPaths.RADIUS : VectorPaths.RADIUS * innerRatio;
        const angle = (index / steps) * MathUtils.TAU - Math.PI / 2;
        VectorPaths.lineOrMove(path, index, Math.cos(angle) * radius, Math.sin(angle) * radius);
      }

      path.closePath();
      return VectorPaths.unit(path, 1);
    });
  }

  /**
   * Build Regular Polygon.
   *
   * @param sides - Number of Sides
   * @returns Unit Variant
   */
  public static polygon(sides: number): VectorVariant {
    return VectorPaths.cached(`polygon:${sides}`, () => {
      const path = new Path2D();

      for (let index = 0; index < sides; index++) {
        const angle = (index / sides) * MathUtils.TAU - Math.PI / 2;
        VectorPaths.lineOrMove(
          path,
          index,
          Math.cos(angle) * VectorPaths.RADIUS,
          Math.sin(angle) * VectorPaths.RADIUS,
        );
      }

      path.closePath();
      return VectorPaths.unit(path, 1);
    });
  }

  /**
   * Build Equilateral Triangle.
   *
   * @returns Unit Variant
   */
  public static triangle(): VectorVariant {
    return VectorPaths.cached("triangle", () => {
      const height = Math.sqrt(3) / 2;
      const path = new Path2D();
      // centroid at the origin
      path.moveTo(0, (-2 * height) / 3);
      path.lineTo(VectorPaths.RADIUS, height / 3);
      path.lineTo(-VectorPaths.RADIUS, height / 3);
      path.closePath();
      return VectorPaths.unit(path, height);
    });
  }

  /**
   * Build Heart.
   *
   * @returns Unit Variant
   */
  public static heart(): VectorVariant {
    return VectorPaths.cached("heart", () => {
      const path = new Path2D();
      path.moveTo(0, 0.45);
      path.bezierCurveTo(-0.2, 0.3, -0.5, 0.1, -0.5, -0.15);
      path.bezierCurveTo(-0.5, -0.35, -0.35, -0.45, -0.25, -0.45);
      path.bezierCurveTo(-0.1, -0.45, 0, -0.35, 0, -0.25);
      path.bezierCurveTo(0, -0.35, 0.1, -0.45, 0.25, -0.45);
      path.bezierCurveTo(0.35, -0.45, 0.5, -0.35, 0.5, -0.15);
      path.bezierCurveTo(0.5, 0.1, 0.2, 0.3, 0, 0.45);
      path.closePath();
      return VectorPaths.unit(path, 0.9);
    });
  }

  /**
   * Build Curly Ribbon.
   * A wavy band running along the vertical axis (length 1).
   *
   * @param waves - Half Sine Waves along the Length
   * @param thickness - Band Thickness Relative to Length
   * @returns Unit Variant
   */
  public static ribbon(waves: number, thickness: number): VectorVariant {
    return VectorPaths.cached(`ribbon:${waves}:${thickness}`, () => {
      const path = new Path2D();
      const samples = VectorPaths.RIBBON_SAMPLES;
      const half = thickness / 2;
      const centerX = (t: number): number =>
        VectorPaths.RIBBON_AMPLITUDE * Math.sin(Math.PI * waves * t);

      // down the left edge, then back up the right edge
      for (let index = 0; index <= samples; index++) {
        const t = index / samples;
        VectorPaths.lineOrMove(path, index, centerX(t) - half, t - VectorPaths.RADIUS);
      }

      for (let index = samples; index >= 0; index--) {
        const t = index / samples;
        path.lineTo(centerX(t) + half, t - VectorPaths.RADIUS);
      }

      path.closePath();
      return VectorPaths.unit(path, 1);
    });
  }

  /**
   * Build Variant from SVG Path Data or Path2D.
   *
   * @param source - SVG Path Data or Path2D
   * @param viewBox - Path Coordinate Box `[width, height]`
   * @returns Unit Variant
   */
  public static fromPath(
    source: string | Path2D,
    viewBox: readonly [number, number],
  ): VectorVariant {
    const [width, height] = viewBox;
    const longest = Math.max(width, height);

    return {
      path: typeof source === "string" ? new Path2D(source) : source,
      scale: 1 / longest,
      offsetX: -width / 2,
      offsetY: -height / 2,
      aspect: height / width,
    };
  }

  /**
   * Return Cached Variant or Build It.
   *
   * @param key - Cache Key
   * @param build - Variant Builder
   * @returns Unit Variant
   */
  private static cached(key: string, build: () => VectorVariant): VectorVariant {
    let variant = VectorPaths.cache.get(key);

    if (!variant) {
      variant = build();
      VectorPaths.cache.set(key, variant);
    }

    return variant;
  }

  /**
   * Wrap Unit-Space Path.
   *
   * @param path - Unit-Space Path
   * @param aspect - Height-to-Width Ratio
   * @returns Unit Variant
   */
  private static unit(path: Path2D, aspect: number): VectorVariant {
    return { path, scale: 1, offsetX: 0, offsetY: 0, aspect };
  }

  /**
   * Move to First Point, Line to Others.
   *
   * @param path - Target Path
   * @param index - Point Index
   * @param x - X Coordinate
   * @param y - Y Coordinate
   */
  private static lineOrMove(path: Path2D, index: number, x: number, y: number): void {
    if (index === 0) {
      path.moveTo(x, y);
    } else {
      path.lineTo(x, y);
    }
  }
}
