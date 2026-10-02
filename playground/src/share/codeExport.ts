import type { FireInput } from "konfeti";

import type { DemoAssets } from "../demoAssets";
import { t } from "../i18n/messages";
import { isBurstList } from "../jsonIO";

/**
 * Copy Code Mode.
 * "changed" writes the minimal build (only what differs from the library defaults), "all" the explicit build
 * (every setting written out).
 */
export type CodeMode = "changed" | "all";

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
 * Generate a Ready-to-Paste `Konfeti.fire()` Snippet for the Current Settings.
 * The input is written as built: one object for one burst, a list for several (a burst at its defaults is `{}`).
 *
 * @param input - Built Fire Input (without hooks): the minimal build for "changed", the explicit one for "all"
 * @param assets - Demo Images (replaced by placeholder paths)
 * @param mode - Code Mode (picks the trailing comment)
 * @returns TypeScript Source
 */
export function toCode(input: FireInput, assets: DemoAssets, mode: CodeMode): string {
  // a single burst with nothing changed is the plain `Konfeti.fire()` call
  const allDefaults = mode === "changed" && !isBurstList(input) && Object.keys(input).length === 0;
  const body = allDefaults ? "" : (write(input, 0, placeholderFor(assets)) ?? "");
  const comment =
    mode === "all"
      ? "code.commentAll"
      : allDefaults
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

/**
 * Write the Code that Fires a Built-in Preset as It Is.
 * Used while the editor holds an unchanged preset: shorter than its options, and it follows later library updates
 * of that preset.
 *
 * @param name - Preset Name
 * @returns TypeScript Snippet
 */
export function presetCode(name: string): string {
  return [
    'import { Konfeti, KonfetiPresets } from "konfeti";',
    "",
    `Konfeti.fire(KonfetiPresets.${name}); // ${t("code.commentPreset")}`,
    "",
  ].join("\n");
}
