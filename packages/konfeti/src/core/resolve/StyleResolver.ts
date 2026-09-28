import { EASING_FUNCTIONS } from "../../config/EasingFunctions";
import {
  COLOR_OVER_LIFE_STEPS,
  DEFAULT_FADE_OUT,
  DEFAULT_FLIP,
  DEFAULT_GRADIENT_ANGLE,
  DEFAULT_SHADOW,
  DEFAULT_STROKE_WIDTH,
  DEFAULT_STYLE,
  DEFAULT_WOBBLE,
} from "../../config/PaperDefaults";
import type { ColorInput } from "../../types/ColorInput";
import type { ColorMode } from "../../types/ColorMode";
import type { ColorSource } from "../../types/ColorSource";
import type { Easing, EasingFunction } from "../../types/Easing";
import type { FadeOutOptions } from "../../types/FadeOutOptions";
import type { FlipOptions } from "../../types/FlipOptions";
import type { ResolvedPalette } from "../../types/resolved/ResolvedPalette";
import type { ResolvedStyle } from "../../types/resolved/ResolvedStyle";
import type { Rgba } from "../../types/resolved/Rgba";
import type { ShadowOptions } from "../../types/ShadowOptions";
import type { ShapeStyle } from "../../types/ShapeStyle";
import type { WeightedColor } from "../../types/WeightedColor";
import type { WobbleOptions } from "../../types/WobbleOptions";
import { ColorMix } from "../../utils/ColorMix";
import { ColorUtils } from "../../utils/ColorUtils";
import { MathUtils } from "../../utils/MathUtils";
import { RangeUtils } from "../../utils/RangeUtils";
import { ResolveUtils } from "./ResolveUtils";

/**
 * Static Common Style Resolver.
 */
export class StyleResolver {
  /**
   * Resolve Style Layers.
   *
   * @param layers - Style Layers, Lowest Priority First (library defaults are prepended automatically)
   * @param name - Option Path Prefix for Error Messages
   * @returns Resolved Style
   */
  public static resolve(layers: readonly (ShapeStyle | undefined)[], name: string): ResolvedStyle {
    const all: readonly (ShapeStyle | undefined)[] = [DEFAULT_STYLE, ...layers];
    const value = <K extends keyof typeof DEFAULT_STYLE>(
      key: K,
    ): NonNullable<ShapeStyle[K]> | (typeof DEFAULT_STYLE)[K] =>
      ResolveUtils.pick(all, key) ?? DEFAULT_STYLE[key];

    const colorMode = value("colorMode");
    const backShade = MathUtils.clamp(value("backShade"), 0, 1);
    const backColor = value("backColor");
    const palette = StyleResolver.resolvePalette(
      value("colors"),
      colorMode,
      backShade,
      `${name}.colors`,
    );
    const opacity = RangeUtils.toTuple(value("opacity"), `${name}.opacity`);
    const tilt = RangeUtils.toTuple(value("tilt"), `${name}.tilt`);
    const stroke = value("stroke");
    const gradient = value("gradient");
    const colorOverLife = value("colorOverLife");
    const scaleOverLife = value("scaleOverLife");
    const fadeOut = ResolveUtils.mergeToggle<Required<FadeOutOptions>>(
      all.map((layer) => layer?.fadeOut),
      DEFAULT_FADE_OUT,
    );
    const flip = ResolveUtils.mergeToggle<Required<FlipOptions>>(
      all.map((layer) => layer?.flip),
      DEFAULT_FLIP,
    );
    const wobble = ResolveUtils.mergeToggle<Required<WobbleOptions>>(
      all.map((layer) => layer?.wobble),
      DEFAULT_WOBBLE,
    );
    const shadow = ResolveUtils.mergeToggle<Required<ShadowOptions>>(
      all.map((layer) => layer?.shadow),
      DEFAULT_SHADOW,
    );

    return {
      scale: RangeUtils.toTuple(value("scale"), `${name}.scale`),
      palette,
      backPalette:
        backColor === "auto"
          ? null
          : StyleResolver.resolvePalette(backColor, colorMode, backShade, `${name}.backColor`),
      gradient:
        gradient === false
          ? null
          : {
              colors: gradient.colors.map((color) => ColorUtils.toCss(ColorUtils.parse(color))),
              angle: gradient.angle ?? DEFAULT_GRADIENT_ANGLE,
            },
      colorOverLife:
        colorOverLife === false
          ? null
          : StyleResolver.resolveColorOverLife(
              palette.rgba,
              colorOverLife.to,
              colorOverLife.easing,
            ),
      stroke:
        stroke === false
          ? null
          : {
              color: ColorUtils.toCss(ColorUtils.parse(stroke.color)),
              width: RangeUtils.toTuple(
                stroke.width ?? DEFAULT_STROKE_WIDTH,
                `${name}.stroke.width`,
              ),
            },
      opacity: [MathUtils.clamp(opacity[0], 0, 1), MathUtils.clamp(opacity[1], 0, 1)],
      fadeIn: MathUtils.clamp(value("fadeIn"), 0, 1),
      fadeOut:
        fadeOut === false
          ? null
          : {
              start: MathUtils.clamp(fadeOut.start, 0, 1),
              easing: StyleResolver.resolveEasing(fadeOut.easing),
            },
      scaleOverLife:
        scaleOverLife === false
          ? null
          : {
              to: Math.max(0, scaleOverLife.to),
              easing: StyleResolver.resolveEasing(scaleOverLife.easing ?? "linear"),
            },
      rotation: RangeUtils.toTuple(value("rotation"), `${name}.rotation`),
      rotationSpeed: RangeUtils.toTuple(value("rotationSpeed"), `${name}.rotationSpeed`),
      flip:
        flip === false
          ? null
          : {
              frequency: RangeUtils.toTuple(flip.frequency, `${name}.flip.frequency`),
              axis: flip.axis,
            },
      wobble:
        wobble === false
          ? null
          : {
              amplitude: RangeUtils.toTuple(wobble.amplitude, `${name}.wobble.amplitude`),
              frequency: RangeUtils.toTuple(wobble.frequency, `${name}.wobble.frequency`),
            },
      tilt: [Math.abs(tilt[0]), Math.abs(tilt[1])],
      shadow:
        shadow === false
          ? null
          : {
              color: ColorUtils.toCss(ColorUtils.parse(shadow.color)),
              blur: Math.max(0, shadow.blur),
              offsetX: shadow.offsetX,
              offsetY: shadow.offsetY,
            },
      shine: MathUtils.clamp(value("shine"), 0, 1),
      blendMode: value("blendMode"),
    };
  }

  /**
   * Resolve Color Source into Palette.
   *
   * @param source - Public Color Source
   * @param mode - Color Pick Strategy
   * @param shade - Back-Side Darkening Amount
   * @param name - Option Name for Error Messages
   * @returns Resolved Palette
   */
  public static resolvePalette(
    source: ColorSource,
    mode: ColorMode,
    shade: number,
    name: string,
  ): ResolvedPalette {
    const entries: readonly (ColorInput | WeightedColor)[] =
      typeof source === "string" ? [source] : source;

    if (entries.length === 0) {
      throw new TypeError(`konfeti: "${name}" must contain at least one color`);
    }

    const colors: string[] = [];
    const rgba: Rgba[] = [];
    const shadedColors: string[] = [];
    const cumulativeWeights: number[] = [];
    let totalWeight = 0;

    for (const entry of entries) {
      const color = typeof entry === "string" ? entry : entry.color;
      const weight = typeof entry === "string" ? 1 : entry.weight;
      ResolveUtils.assertPositive(weight, `${name} weight`);

      const parsed = ColorUtils.parse(color);
      totalWeight += weight;
      colors.push(ColorUtils.toCss(parsed));
      rgba.push(parsed);
      shadedColors.push(ColorUtils.toCss(ColorUtils.shade(parsed, shade)));
      cumulativeWeights.push(totalWeight);
    }

    return { colors, rgba, shadedColors, cumulativeWeights, totalWeight, mode };
  }

  /**
   * Resolve Easing into Function.
   *
   * @param easing - Easing Name or Function
   * @returns Easing Function
   */
  public static resolveEasing(easing: Easing): EasingFunction {
    return typeof easing === "function" ? easing : EASING_FUNCTIONS[easing];
  }

  /**
   * Build Color-over-Life Lookup Tables.
   *
   * @param colors - Parsed Palette Colors
   * @param to - End Color
   * @param easing - Transition Easing
   * @returns Resolved Color-over-Life Settings
   */
  private static resolveColorOverLife(
    colors: readonly Rgba[],
    to: ColorInput,
    easing: Easing | undefined,
  ): NonNullable<ResolvedStyle["colorOverLife"]> {
    const target = ColorUtils.parse(to);

    return {
      tables: colors.map((color) => ColorMix.table(color, target, COLOR_OVER_LIFE_STEPS)),
      easing: StyleResolver.resolveEasing(easing ?? "linear"),
    };
  }
}
