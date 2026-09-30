import type { HexColor } from "../types/ColorInput";

/**
 * Built-in Color Themes.
 * Ready-made color lists for `colors` (on `paper` or any shape), one per member. Plain read-only data: use one
 * as is, mix two, or spread one into your own list.
 *
 * @example
 * ```ts
 * import { Konfeti, KonfetiPalettes } from "konfeti";
 *
 * Konfeti.fire({ paper: { colors: KonfetiPalettes.PASTEL } });
 * Konfeti.fire({ paper: { colors: [...KonfetiPalettes.GOLD, "#ffffff"] } });
 * Konfeti.fire({ shapes: [{ type: "star", colors: KonfetiPalettes.NEON }] });
 * ```
 */
export const KonfetiPalettes = {
  /**
   * Classic.
   * The library's default mix of bright confetti colors.
   */
  CLASSIC: ["#26ccff", "#a25afd", "#ff5e7e", "#88ff5a", "#fcff42", "#ffa62d", "#ff36ff"],

  /**
   * Pastel.
   * Soft, light tints for baby showers, weddings and calm celebrations.
   */
  PASTEL: ["#ffd1dc", "#ffe4b5", "#fffacd", "#d4f0c0", "#c1e1ff", "#e0c3fc"],

  /**
   * Gold.
   * Warm golds and champagne for awards, anniversaries and "premium" moments.
   */
  GOLD: ["#ffd700", "#ffcc33", "#f5b700", "#e6be8a", "#fff1b8", "#c9a227"],

  /**
   * Neon.
   * Saturated glowing colors; pair with `blendMode: "lighter"` on dark backgrounds.
   */
  NEON: ["#39ff14", "#ff073a", "#00f0ff", "#ff00ff", "#fff01f", "#ff6ec7"],

  /**
   * Rainbow.
   * The six spectrum colors in order (try `colorMode: "sequence"`).
   */
  RAINBOW: ["#ff0000", "#ff8000", "#ffff00", "#00c000", "#0080ff", "#8000ff"],

  /**
   * Winter.
   * Whites, ice blues and silver for snow and holiday scenes.
   */
  WINTER: ["#ffffff", "#e8f4ff", "#b3dcff", "#7fb8e6", "#c0c0c0"],

  /**
   * Autumn.
   * Burnt orange, amber, rust and deep red — falling leaves (try `form: "leaf"`).
   */
  AUTUMN: ["#d35400", "#e67e22", "#f1c40f", "#a0522d", "#8b0000", "#c0392b"],

  /**
   * Ocean.
   * Deep to pale blues and teals.
   */
  OCEAN: ["#006994", "#0096c7", "#48cae4", "#90e0ef", "#caf0f8", "#00b4d8"],

  /**
   * Candy.
   * Sweet pinks, lilac, mint and lemon.
   */
  CANDY: ["#ff6fb5", "#ff9ecd", "#b5a2ff", "#7ee8fa", "#fff47d", "#ffb86f"],

  /**
   * Forest.
   * Greens from pine to lime, with a touch of bark brown.
   */
  FOREST: ["#1b4332", "#2d6a4f", "#40916c", "#74c69d", "#b7e4c7", "#8b5a2b"],

  /**
   * Monochrome.
   * White to charcoal grays — elegant on colored backgrounds.
   */
  MONOCHROME: ["#ffffff", "#e5e5e5", "#bdbdbd", "#8a8a8a", "#4d4d4d"],
} as const satisfies Readonly<Record<string, readonly HexColor[]>>;

/**
 * Built-in Color Theme Name (`"PASTEL"`, `"GOLD"` …).
 */
export type KonfetiPaletteName = keyof typeof KonfetiPalettes;
