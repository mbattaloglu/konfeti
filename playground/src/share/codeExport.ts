import type { FireOptions } from "konfeti";

import type { DemoAssets } from "../demoAssets";
import { t } from "../i18n/messages";

/**
 * Indent Unit of the Generated Code.
 */
const INDENT = "  ";

/**
 * Longest Array that Stays on One Line.
 */
const INLINE_ARRAY_LIMIT = 72;

/**
 * Identifier-Safe Object Key Pattern (no quotes needed).
 */
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/**
 * Placeholder Files Standing in for the Playground's Demo Images.
 */
const PLACEHOLDERS = {
  coin: "/coin.png",
  sheet: "/coin-spin.png",
  logo: "/logo.png",
  upload: "/your-image.png",
} as const;

/**
 * Build Lookup from Runtime Image Sources (demo canvases, blob URLs) to Readable Placeholder Paths.
 *
 * @param assets - Demo Images
 * @returns Lookup Returning a Placeholder or Null
 */
function placeholderFor(assets: DemoAssets): (value: unknown) => string | null {
  return (value) => {
    if (value === assets.coinCanvas || value === assets.coinUrl) {
      return PLACEHOLDERS.coin;
    }

    if (value === assets.sheetCanvas || value === assets.sheetUrl) {
      return PLACEHOLDERS.sheet;
    }

    if (value === assets.logoCanvas) {
      return PLACEHOLDERS.logo;
    }

    // a picked file is an object URL that only exists in this browser
    if (typeof value === "string" && value.startsWith("blob:")) {
      return PLACEHOLDERS.upload;
    }

    return null;
  };
}

/**
 * Write a Value as TypeScript Source.
 *
 * @param value - Value
 * @param depth - Nesting Depth
 * @param placeholder - Runtime Image Lookup
 * @returns Source Text, or Null for Values Code Cannot Express (functions, DOM nodes)
 */
function write(
  value: unknown,
  depth: number,
  placeholder: (value: unknown) => string | null,
): string | null {
  const replaced = placeholder(value);

  if (replaced !== null) {
    return JSON.stringify(replaced);
  }

  if (value === null || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value !== "object" || value instanceof Element) {
    return null;
  }

  const pad = INDENT.repeat(depth + 1);
  const close = INDENT.repeat(depth);

  if (Array.isArray(value)) {
    const items = value
      .map((item: unknown) => write(item, depth + 1, placeholder))
      .filter((item): item is string => item !== null);
    const inline = `[${items.join(", ")}]`;

    return inline.length <= INLINE_ARRAY_LIMIT && !inline.includes("\n")
      ? inline
      : `[\n${items.map((item) => pad + item).join(",\n")},\n${close}]`;
  }

  const entries = Object.entries(value)
    .map(([key, item]) => {
      const written = write(item, depth + 1, placeholder);
      const name = IDENTIFIER.test(key) ? key : JSON.stringify(key);
      return written === null ? null : `${pad}${name}: ${written}`;
    })
    .filter((entry): entry is string => entry !== null);

  return entries.length === 0 ? "{}" : `{\n${entries.join(",\n")},\n${close}}`;
}

/**
 * Keep Only What Differs from the Baseline (objects compared key by key, everything else as a whole).
 *
 * @param value - Current Value
 * @param baseline - Value with Default Settings
 * @returns The Differing Part, or Undefined when Equal
 */
function difference(value: unknown, baseline: unknown): unknown {
  const isObject = (item: unknown): item is Record<string, unknown> =>
    typeof item === "object" && item !== null && !Array.isArray(item) && !(item instanceof Element);

  if (isObject(value) && isObject(baseline)) {
    const changed = Object.entries(value)
      .map(([key, item]) => [key, difference(item, baseline[key])] as const)
      .filter(([, item]) => item !== undefined);

    return changed.length === 0 ? undefined : Object.fromEntries(changed);
  }

  return value === baseline || JSON.stringify(value) === JSON.stringify(baseline)
    ? undefined
    : value;
}

/**
 * Generate a Ready-to-Paste `Konfeti.fire()` Snippet for the Current Settings.
 * With `defaults`, only settings that differ from them are written (what was actually tuned); with `null`,
 * every setting is written out.
 *
 * @param options - Current Fire Options (without hooks)
 * @param defaults - Fire Options Built from the Default Settings, or Null for Every Setting
 * @param assets - Demo Images (replaced by placeholder paths)
 * @returns TypeScript Source
 */
export function toCode(
  options: FireOptions,
  defaults: FireOptions | null,
  assets: DemoAssets,
): string {
  const shown = defaults === null ? options : difference(options, defaults);
  const body = shown === undefined ? "" : (write(shown, 0, placeholderFor(assets)) ?? "");
  const comment =
    defaults === null
      ? "code.commentAll"
      : body === ""
        ? "code.commentDefaults"
        : "code.commentChanged";
  const usesImages = Object.values(PLACEHOLDERS).some((path) =>
    body.includes(JSON.stringify(path)),
  );

  return [
    'import { Konfeti } from "konfeti";',
    "",
    ...(usesImages ? [`// ${t("code.commentImages")}`] : []),
    `Konfeti.fire(${body}); // ${t(comment)}`,
    "",
  ].join("\n");
}
