import type { ColorMode } from "./ColorMode";
import type { ColorOverLifeOptions } from "./ColorOverLifeOptions";
import type { ColorSource } from "./ColorSource";
import type { FadeOutOptions } from "./FadeOutOptions";
import type { FlipOptions } from "./FlipOptions";
import type { GradientOptions } from "./GradientOptions";
import type { Range } from "./Range";
import type { ScaleOverLifeOptions } from "./ScaleOverLifeOptions";
import type { ShadowOptions } from "./ShadowOptions";
import type { StrokeOptions } from "./StrokeOptions";
import type { WobbleOptions } from "./WobbleOptions";
import type { Degrees, DegreesPerSecond, Multiplier, Ratio } from "./Units";

/**
 * Common Particle Style.
 * Shared by every shape. Values set in `paper` also act as the base for all other shapes in `shapes`, so a
 * single `paper: { colors }` recolors stars, hearts and text too. Bitmap shapes (emoji, image, spritesheet)
 * ignore color and stroke keys.
 */
export type ShapeStyle = {
  /**
   * Uniform Size Multiplier.
   * Scales every size-related value (size, width, height, radius, stroke) together.
   *
   * @defaultValue `1`
   */
  readonly scale?: Range<Multiplier>;
  /**
   * Front Colors.
   *
   * @defaultValue `["#26ccff", "#a25afd", "#ff5e7e", "#88ff5a", "#fcff42", "#ffa62d", "#ff36ff"]`
   * @see {@link ColorSource}
   */
  readonly colors?: ColorSource;
  /**
   * Color Pick Strategy.
   *
   * @defaultValue `"random"`
   * @see {@link ColorMode}
   */
  readonly colorMode?: ColorMode;
  /**
   * Back Side Colors.
   * Shown while the 3D flip turns the particle away from the viewer. `"auto"` uses the front color darkened
   * by `backShade`. A color list picks independently of the front color.
   *
   * @defaultValue `"auto"`
   * @example
   * ```ts
   * paper: { colors: "gold", backColor: "silver" }
   * ```
   */
  readonly backColor?: ColorSource | "auto";
  /**
   * Back Side Darkening.
   * How much darker the back side is when `backColor` is `"auto"`. `0` = same as front, `1` = black.
   *
   * @defaultValue `0.3`
   */
  readonly backShade?: Ratio;
  /**
   * Gradient Fill.
   * `false` (or omitted) uses flat colors.
   *
   * @defaultValue `false`
   * @see {@link GradientOptions}
   */
  readonly gradient?: GradientOptions | false;
  /**
   * Color Transition over Lifetime.
   * `false` (or omitted) keeps the color constant.
   *
   * @defaultValue `false`
   * @see {@link ColorOverLifeOptions}
   */
  readonly colorOverLife?: ColorOverLifeOptions | false;
  /**
   * Outline.
   * `false` (or omitted) draws no outline.
   *
   * @defaultValue `false`
   * @remarks Stroking costs roughly one extra draw call per particle.
   */
  readonly stroke?: StrokeOptions | false;
  /**
   * Starting Opacity.
   * `1` is fully opaque, `0` is invisible.
   *
   * @defaultValue `1`
   */
  readonly opacity?: Range<Ratio>;
  /**
   * Fade-In Duration.
   * Fraction of the lifetime spent fading in from transparent. `0` appears instantly.
   *
   * @defaultValue `0`
   */
  readonly fadeIn?: Ratio;
  /**
   * Fade Out near End of Life.
   * `true` uses the default fade, `false` keeps particles opaque until they disappear, an object customizes it.
   *
   * @defaultValue `{ start: 0.7, easing: "linear" }`
   * @see {@link FadeOutOptions}
   */
  readonly fadeOut?: boolean | FadeOutOptions;
  /**
   * Size Transition over Lifetime.
   * `false` (or omitted) keeps the size constant.
   *
   * @defaultValue `false`
   * @see {@link ScaleOverLifeOptions}
   */
  readonly scaleOverLife?: ScaleOverLifeOptions | false;
  /**
   * Initial Rotation.
   *
   * @defaultValue `[0, 360]`
   */
  readonly rotation?: Range<Degrees>;
  /**
   * Spin Speed.
   * Negative values spin counter-clockwise.
   *
   * @defaultValue `[-240, 240]`
   */
  readonly rotationSpeed?: Range<DegreesPerSecond>;
  /**
   * 3D Flip.
   * `true` uses the default flip, `false` keeps the particle flat, an object customizes it.
   *
   * @defaultValue `{ frequency: [0.6, 1.8], axis: "x" }`
   * @see {@link FlipOptions}
   */
  readonly flip?: boolean | FlipOptions;
  /**
   * Side-to-Side Flutter.
   * `true` uses the default wobble, `false` disables it, an object customizes it.
   *
   * @defaultValue `{ amplitude: [2, 8], frequency: [0.4, 1.2] }`
   * @see {@link WobbleOptions}
   */
  readonly wobble?: boolean | WobbleOptions;
  /**
   * Perspective Tilt.
   * Maximum oscillating skew, synced to the wobble, that makes flat pieces look like they catch the air.
   * `0` disables it.
   *
   * @defaultValue `0`
   * @example
   * ```ts
   * paper: { tilt: 25 }
   * ```
   */
  readonly tilt?: Range<Degrees>;
  /**
   * Drop Shadow.
   * `false` (or omitted) draws no shadow.
   *
   * @defaultValue `false`
   * @see {@link ShadowOptions}
   */
  readonly shadow?: ShadowOptions | false;
  /**
   * Specular Shine.
   * Brightens the particle while it faces the viewer during the flip. `0` disables it, `1` is a strong glint.
   * Only visible when `flip` is enabled; ignored by emoji, image and spritesheet shapes.
   *
   * @defaultValue `0`
   * @remarks Costs one extra fill per visible particle.
   */
  readonly shine?: Ratio;
  /**
   * Canvas Blend Mode.
   * For example `"lighter"` for glowing additive colors.
   *
   * @defaultValue `"source-over"`
   */
  readonly blendMode?: GlobalCompositeOperation;
};
