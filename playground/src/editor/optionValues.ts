import { KonfetiPalettes } from "konfeti";

import type { ControlValue, NumberPair, ValueDomain } from "../controlTypes";

/**
 * Hex Color and Alpha, Split from One Color String.
 */
export type SplitColor = {
  /**
   * Lowercase `#rrggbb` Color.
   */
  readonly hex: string;
  /**
   * Opacity, 0–1.
   */
  readonly alpha: number;
};

/**
 * Significant Digits Shown by formatExact.
 * Hides binary float noise (`0.15000000000000002` → `0.15`) without rounding real values to the step.
 */
export const EXACT_DIGITS = 12;

/**
 * Theme Name when the Colors Match No Built-In Palette.
 */
export const CUSTOM_THEME = "custom";

/**
 * Long Hex Color Pattern (`#rrggbb`, any case).
 */
const LONG_HEX = /^#[0-9a-f]{6}$/i;

/**
 * Short Hex Color Pattern (`#rgb`, any case).
 */
const SHORT_HEX = /^#[0-9a-f]{3}$/i;

/**
 * Any Single Hex Digit (doubled to expand `#rgb`).
 */
const HEX_DIGIT = /[0-9a-f]/gi;

/**
 * `rgb()` / `rgba()` Pattern with Integer Channels and an Optional Alpha.
 */
const RGB_FUNCTION =
  /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d*\.?\d+)\s*)?\)$/i;

/**
 * Radix of Hex Color Digits.
 */
const HEX_RADIX = 16;

/**
 * Hex Digits per Color Channel.
 */
const HEX_DIGITS_PER_CHANNEL = 2;

/**
 * One Channel of a `#rrggbb` Color (two hex digits).
 */
const HEX_CHANNEL = /[0-9a-f]{2}/g;

/**
 * Largest Color Channel Value.
 */
const CHANNEL_MAX = 255;

/**
 * Item Count of a Number Pair.
 */
const PAIR_LENGTH = 2;

/**
 * Check Whether a Value Is a Finite Number.
 *
 * @param value - Any Value
 * @returns Finite Number Flag
 */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Check Whether a Value Is an Object Record (not null, not an array).
 *
 * @param value - Any Value
 * @returns Object Record Flag
 */
export function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Return a Value as an Array of Unknown Items.
 *
 * @param value - Any Value
 * @returns The Array, or Null for Anything Else
 */
export function asList(value: unknown): readonly unknown[] | null {
  return Array.isArray(value) ? (value as readonly unknown[]) : null;
}

/**
 * Check Whether a State Value Is a Number Pair (exactly two finite numbers).
 * Option values from `FireOptions` go through the looser pairOf instead.
 *
 * @param value - State Value
 * @returns Number Pair Flag
 */
export function isNumberPair(value: unknown): value is NumberPair {
  const items = asList(value);

  return (
    items !== null &&
    items.length === PAIR_LENGTH &&
    isFiniteNumber(items[0]) &&
    isFiniteNumber(items[1])
  );
}

/**
 * Return an Ordered Pair from a Trusted Number or Tuple (library defaults).
 *
 * @param range - Number or `[min, max]` Tuple
 * @returns Sorted Pair
 */
export function toPair(range: number | readonly [number, number]): NumberPair {
  if (typeof range === "number") {
    return [range, range];
  }

  const [low, high] = range;

  return low <= high ? [low, high] : [high, low];
}

/**
 * Read a Range Option the Way the Library Does.
 * A number gives `[n, n]`, an array its first two items, `{ min, max }` its bounds; the result is sorted.
 *
 * @param value - Option Value
 * @returns Sorted Pair, or Null for Anything the Library Would Reject
 */
export function pairOf(value: unknown): NumberPair | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? [value, value] : null;
  }

  const items = asList(value);
  const bounds = items ?? (isRecord(value) ? [value["min"], value["max"]] : null);

  if (bounds === null) {
    return null;
  }

  // like the library, items after the first two are ignored
  const [low, high] = bounds;

  if (!isFiniteNumber(low) || !isFiniteNumber(high)) {
    return null;
  }

  return low <= high ? [low, high] : [high, low];
}

/**
 * Turn a Pair into the Range Option Form.
 *
 * @param pair - Number Pair
 * @returns The Number when Both Bounds Are Equal, Else the Pair
 */
export function rangeOf(pair: NumberPair): number | NumberPair {
  return pair[0] === pair[1] ? pair[0] : [pair[0], pair[1]];
}

/**
 * Compare Two Control Values (arrays item by item, so `-0` equals `0`).
 *
 * @param a - First Value
 * @param b - Second Value
 * @returns Equal Flag
 */
export function sameValue(a: ControlValue, b: ControlValue): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => item === b[index]);
  }

  return a === b;
}

/**
 * Compare Two Option-Like Values Structurally.
 * Numbers, strings and booleans by `===`, arrays item by item, plain objects by their key sets; anything else
 * (canvases, functions) by identity.
 *
 * @param a - First Value
 * @param b - Second Value
 * @returns Equal Flag
 */
export function sameDeep(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }

  const listA = asList(a);
  const listB = asList(b);

  if (listA !== null || listB !== null) {
    return (
      listA !== null &&
      listB !== null &&
      listA.length === listB.length &&
      listA.every((item, index) => sameDeep(item, listB[index]))
    );
  }

  if (!isPlainObject(a) || !isPlainObject(b)) {
    return false;
  }

  const keysA = Object.keys(a);

  return (
    keysA.length === Object.keys(b).length &&
    keysA.every((key) => Object.hasOwn(b, key) && sameDeep(a[key], b[key]))
  );
}

/**
 * Check Whether a Value Is a Plain Object Literal (not a class instance such as a canvas).
 *
 * @param value - Any Value
 * @returns Plain Object Flag
 */
function isPlainObject(value: unknown): value is Readonly<Record<string, unknown>> {
  if (!isRecord(value)) {
    return false;
  }

  const prototype: unknown = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

/**
 * Format a Number Exactly (no rounding to the slider step).
 *
 * @param value - Number
 * @returns Display Text (`-0` shows as `0`)
 */
export function formatExact(value: number): string {
  return String(Number(value.toPrecision(EXACT_DIGITS)));
}

/**
 * Parse a Typed Number (a decimal comma works too).
 *
 * @param text - Typed Text
 * @returns Finite Number, or Null for Empty or Unparsable Text
 */
export function parseNumberEntry(text: string): number | null {
  const trimmed = text.trim();

  if (trimmed === "") {
    return null;
  }

  const value = Number(trimmed.replace(",", "."));

  // `-0 === 0`, so this also stores a typed "-0" as 0
  return Number.isFinite(value) ? (value === 0 ? 0 : value) : null;
}

/**
 * Parse the Two Fields of a Span Editor.
 * An empty field takes the other field's value; the result is sorted.
 *
 * @param minText - Typed Minimum
 * @param maxText - Typed Maximum
 * @returns Sorted Pair, or Null when Both Are Empty or Either Is Unparsable
 */
export function parseSpanEntry(minText: string, maxText: string): NumberPair | null {
  const minBlank = minText.trim() === "";
  const maxBlank = maxText.trim() === "";
  const low = minBlank ? null : parseNumberEntry(minText);
  const high = maxBlank ? null : parseNumberEntry(maxText);

  if ((!minBlank && low === null) || (!maxBlank && high === null)) {
    return null;
  }

  const first = low ?? high;
  const second = high ?? low;

  if (first === null || second === null) {
    return null;
  }

  return first <= second ? [first, second] : [second, first];
}

/**
 * Check Whether a Value Lies in a Control's Domain.
 * A pair is checked bound by bound; non-finite numbers are always rejected.
 *
 * @param domain - Control Domain (none: every finite number)
 * @param value - Number or Pair
 * @returns In-Domain Flag
 */
export function inDomain(domain: ValueDomain | undefined, value: number | NumberPair): boolean {
  if (typeof value !== "number") {
    return inDomain(domain, value[0]) && inDomain(domain, value[1]);
  }

  if (!Number.isFinite(value)) {
    return false;
  }

  if (domain === undefined || (domain.zeroAllowed === true && value === 0)) {
    return true;
  }

  const checked = domain.floored === true ? Math.floor(value) : value;
  const aboveMin = domain.exclusive === true ? checked > domain.min : checked >= domain.min;

  return aboveMin && (domain.max === undefined || checked <= domain.max);
}

/**
 * Read a Hex Color (`#rgb` or `#rrggbb`, any case).
 *
 * @param color - Any Value
 * @returns Lowercase `#rrggbb`, or Null for Anything Else
 */
export function hexOf(color: unknown): string | null {
  if (typeof color !== "string") {
    return null;
  }

  if (LONG_HEX.test(color)) {
    return color.toLowerCase();
  }

  if (SHORT_HEX.test(color)) {
    return color.replace(HEX_DIGIT, (digit) => digit + digit).toLowerCase();
  }

  return null;
}

/**
 * Combine a Hex Color and an Opacity into One Color String.
 * The library default shadow `"rgba(0,0,0,0.25)"` is exactly `composeColor("#000000", 0.25)`.
 *
 * @param hex - `#rrggbb` Color
 * @param alpha - Opacity, 0–1
 * @returns The Hex Color at Full Opacity, Else `rgba(r,g,b,a)` without Spaces
 */
export function composeColor(hex: string, alpha: number): string {
  const full = hexOf(hex);

  if (alpha >= 1 || full === null) {
    return hex;
  }

  const channels = (full.match(HEX_CHANNEL) ?? []).map((digits) =>
    Number.parseInt(digits, HEX_RADIX),
  );

  return `rgba(${channels.join(",")},${String(alpha)})`;
}

/**
 * Split a Color String into a Hex Color and an Opacity.
 * Accepts `#rgb`, `#rrggbb` and `rgb()` / `rgba()` with integer channels 0–255 and an alpha of 0–1.
 *
 * @param color - Any Value
 * @returns Hex and Alpha, or Null for Any Other Color Syntax
 */
export function splitColor(color: unknown): SplitColor | null {
  const hex = hexOf(color);

  if (hex !== null) {
    return { hex, alpha: 1 };
  }

  const match = typeof color === "string" ? RGB_FUNCTION.exec(color) : null;

  if (match === null) {
    return null;
  }

  const channels = [match[1], match[2], match[3]].map(Number);
  const alpha = match[4] === undefined ? 1 : Number(match[4]);

  if (channels.some((channel) => !(channel <= CHANNEL_MAX)) || !(alpha >= 0 && alpha <= 1)) {
    return null;
  }

  return {
    hex: `#${channels.map((channel) => channel.toString(HEX_RADIX).padStart(HEX_DIGITS_PER_CHANNEL, "0")).join("")}`,
    alpha,
  };
}

/**
 * Return the Theme Name of a Palette (lowercase, spaces for underscores).
 *
 * @param palette - `KonfetiPalettes` Member Name
 * @returns Theme Name (`"classic"`)
 */
export function themeName(palette: string): string {
  return palette.toLowerCase().replace(/_/g, " ");
}

/**
 * Theme Names of Every Built-In Palette, in `KonfetiPalettes` Order.
 */
export const PALETTE_THEMES: readonly string[] = Object.keys(KonfetiPalettes).map(themeName);

/**
 * Derive the Theme Shown for a Color List.
 *
 * @param colors - Palette Colors
 * @returns Name of the First Palette with Exactly These Colors, Else "custom"
 */
export function deriveTheme(colors: readonly string[]): string {
  for (const [name, palette] of Object.entries(KonfetiPalettes)) {
    if (sameValue(colors, palette)) {
      return themeName(name);
    }
  }

  return CUSTOM_THEME;
}
