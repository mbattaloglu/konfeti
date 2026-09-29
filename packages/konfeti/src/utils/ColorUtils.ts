import type { Rgba } from "../types/resolved/Rgba";
import { CanvasFactory } from "./CanvasFactory";

/**
 * Static Color Parsing and Formatting Helpers.
 * Hex, rgb() and hsl() are parsed directly; any other CSS color is normalized by the browser's canvas.
 */
export class ColorUtils {
  /**
   * Maximum Channel Value.
   */
  private static readonly CHANNEL_MAX = 255;

  /**
   * Hex Color Pattern (3, 4, 6 or 8 digits).
   */
  private static readonly HEX_PATTERN = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i;

  /**
   * Functional Color Pattern (`name(args)`).
   */
  private static readonly FUNCTION_PATTERN = /^(rgba?|hsla?)\(([^)]*)\)$/i;

  /**
   * Argument Separator Pattern (commas, spaces, slash).
   */
  private static readonly SEPARATOR_PATTERN = /[\s,/]+/;

  /**
   * Parsed Color Cache.
   */
  private static readonly cache = new Map<string, Rgba>();

  /**
   * Lazily Created Canvas Context for Browser Parsing.
   */
  private static probe: CanvasRenderingContext2D | null = null;

  /**
   * Parse CSS Color.
   *
   * @param input - CSS Color String
   * @returns Parsed Color
   * @throws TypeError when the color is not recognized
   */
  public static parse(input: string): Rgba {
    const key = input.trim().toLowerCase();
    const cached = ColorUtils.cache.get(key);

    if (cached) {
      return cached;
    }

    const parsed =
      ColorUtils.parseHex(key) ?? ColorUtils.parseFunction(key) ?? ColorUtils.parseWithCanvas(key);

    if (!parsed) {
      throw new TypeError(`konfeti: invalid color "${input}"`);
    }

    ColorUtils.cache.set(key, parsed);
    return parsed;
  }

  /**
   * Format Color as CSS String.
   *
   * @param color - Parsed Color
   * @returns `rgb()` or `rgba()` String
   */
  public static toCss(color: Rgba): string {
    const r = Math.round(color.r);
    const g = Math.round(color.g);
    const b = Math.round(color.b);
    return color.a >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${color.a})`;
  }

  /**
   * Darken Color.
   *
   * @param color - Parsed Color
   * @param amount - Darkening Amount (0 keeps, 1 is black)
   * @returns Darkened Color
   */
  public static shade(color: Rgba, amount: number): Rgba {
    const factor = 1 - Math.min(Math.max(amount, 0), 1);
    return { r: color.r * factor, g: color.g * factor, b: color.b * factor, a: color.a };
  }

  /**
   * Parse Hex Color.
   *
   * @param input - Lowercase Color String
   * @returns Parsed Color or Null
   */
  private static parseHex(input: string): Rgba | null {
    const match = ColorUtils.HEX_PATTERN.exec(input);
    const digits = match?.[1];

    if (digits === undefined) {
      return null;
    }

    // expand short forms (#rgb / #rgba) to full length
    const full = digits.length <= 4 ? digits.replace(/./g, "$&$&") : digits;
    const channel = (index: number): number => parseInt(full.slice(index * 2, index * 2 + 2), 16);

    return {
      r: channel(0),
      g: channel(1),
      b: channel(2),
      a: full.length === 8 ? channel(3) / ColorUtils.CHANNEL_MAX : 1,
    };
  }

  /**
   * Parse rgb() / hsl() Color.
   *
   * @param input - Lowercase Color String
   * @returns Parsed Color or Null
   */
  private static parseFunction(input: string): Rgba | null {
    const match = ColorUtils.FUNCTION_PATTERN.exec(input);
    const name = match?.[1];
    const body = match?.[2];

    if (name === undefined || body === undefined) {
      return null;
    }

    const parts = body.trim().split(ColorUtils.SEPARATOR_PATTERN);

    if (parts.length < 3 || parts.length > 4) {
      return null;
    }

    const [first, second, third, alphaPart] = parts;
    const alpha = alphaPart === undefined ? 1 : ColorUtils.parseAlpha(alphaPart);

    if (first === undefined || second === undefined || third === undefined || alpha === null) {
      return null;
    }

    return name.startsWith("rgb")
      ? ColorUtils.fromRgbParts(first, second, third, alpha)
      : ColorUtils.fromHslParts(first, second, third, alpha);
  }

  /**
   * Build Color from rgb() Arguments.
   *
   * @param r - Red Argument
   * @param g - Green Argument
   * @param b - Blue Argument
   * @param a - Alpha Value
   * @returns Parsed Color or Null
   */
  private static fromRgbParts(r: string, g: string, b: string, a: number): Rgba | null {
    const red = ColorUtils.parseChannel(r);
    const green = ColorUtils.parseChannel(g);
    const blue = ColorUtils.parseChannel(b);

    if (red === null || green === null || blue === null) {
      return null;
    }

    return { r: red, g: green, b: blue, a };
  }

  /**
   * Build Color from hsl() Arguments.
   *
   * @param h - Hue Argument
   * @param s - Saturation Argument
   * @param l - Lightness Argument
   * @param a - Alpha Value
   * @returns Parsed Color or Null
   */
  private static fromHslParts(h: string, s: string, l: string, a: number): Rgba | null {
    const hue = ColorUtils.parseNumber(h.replace(/deg$/, ""));
    const saturation = ColorUtils.parsePercent(s);
    const lightness = ColorUtils.parsePercent(l);

    if (hue === null || saturation === null || lightness === null) {
      return null;
    }

    const [r, g, b] = ColorUtils.hslToRgb(hue, saturation, lightness);
    return { r, g, b, a };
  }

  /**
   * Convert HSL to RGB Channels.
   *
   * @param hue - Hue in Degrees
   * @param saturation - Saturation (0–1)
   * @param lightness - Lightness (0–1)
   * @returns RGB Channel Tuple (0–255)
   */
  private static hslToRgb(
    hue: number,
    saturation: number,
    lightness: number,
  ): [r: number, g: number, b: number] {
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const sector = (((hue % 360) + 360) % 360) / 60;
    const secondary = chroma * (1 - Math.abs((sector % 2) - 1));
    const offset = lightness - chroma / 2;
    const table: readonly [number, number, number][] = [
      [chroma, secondary, 0],
      [secondary, chroma, 0],
      [0, chroma, secondary],
      [0, secondary, chroma],
      [secondary, 0, chroma],
      [chroma, 0, secondary],
    ];
    const [r, g, b] = table[Math.floor(sector) % table.length] ?? [0, 0, 0];

    return [
      (r + offset) * ColorUtils.CHANNEL_MAX,
      (g + offset) * ColorUtils.CHANNEL_MAX,
      (b + offset) * ColorUtils.CHANNEL_MAX,
    ];
  }

  /**
   * Parse RGB Channel (number or percent).
   *
   * @param value - Channel Argument
   * @returns Channel (0–255) or Null
   */
  private static parseChannel(value: string): number | null {
    const percent = value.endsWith("%") ? ColorUtils.parsePercent(value) : null;
    const channel =
      percent === null ? ColorUtils.parseNumber(value) : percent * ColorUtils.CHANNEL_MAX;
    return channel === null ? null : Math.min(Math.max(channel, 0), ColorUtils.CHANNEL_MAX);
  }

  /**
   * Parse Alpha (number or percent).
   *
   * @param value - Alpha Argument
   * @returns Alpha (0–1) or Null
   */
  private static parseAlpha(value: string): number | null {
    const alpha = value.endsWith("%")
      ? ColorUtils.parsePercent(value)
      : ColorUtils.parseNumber(value);
    return alpha === null ? null : Math.min(Math.max(alpha, 0), 1);
  }

  /**
   * Parse Percentage into Fraction.
   *
   * @param value - Percent Argument (`50%`)
   * @returns Fraction (0–1) or Null
   */
  private static parsePercent(value: string): number | null {
    if (!value.endsWith("%")) {
      return null;
    }

    const number = ColorUtils.parseNumber(value.slice(0, -1));
    return number === null ? null : Math.min(Math.max(number / 100, 0), 1);
  }

  /**
   * Parse Finite Number.
   *
   * @param value - Numeric Argument
   * @returns Number or Null
   */
  private static parseNumber(value: string): number | null {
    if (value === "") {
      return null;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  /**
   * Parse Color with Browser Canvas.
   * Handles named colors and modern color functions.
   *
   * @param input - Lowercase Color String
   * @returns Parsed Color or Null
   */
  private static parseWithCanvas(input: string): Rgba | null {
    const context = ColorUtils.getProbe();

    if (!context) {
      return null;
    }

    // two different sentinels detect inputs the browser silently rejects
    context.fillStyle = "#000000";
    context.fillStyle = input;
    const first = context.fillStyle;
    context.fillStyle = "#ffffff";
    context.fillStyle = input;
    const second = context.fillStyle;

    if (first !== second) {
      return null;
    }

    return ColorUtils.parseHex(first) ?? ColorUtils.parseFunction(first.replace(/\s+/g, " "));
  }

  /**
   * Return Probe Canvas Context.
   *
   * @returns Canvas Context or Null outside the Browser
   */
  private static getProbe(): CanvasRenderingContext2D | null {
    ColorUtils.probe ??= CanvasFactory.create(1, 1)?.context ?? null;

    return ColorUtils.probe;
  }
}
