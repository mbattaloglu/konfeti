import type { FireInput, FireOptions } from "konfeti";

import type { DemoAssets } from "./demoAssets";
import { isRecord } from "./editor/optionValues";
import { HOOK_KEYS } from "./hooks";

/**
 * Prefix of JSON Placeholders that Stand for Runtime Objects.
 */
export const ASSET_PREFIX = "$asset:";

/**
 * Map Demo Assets to Their JSON Placeholder Names.
 *
 * @param assets - Demo Images
 * @returns Placeholder Name per Object
 */
function assetTokens(assets: DemoAssets): ReadonlyMap<object, string> {
  return new Map<object, string>([
    [assets.coinCanvas, `${ASSET_PREFIX}coinCanvas`],
    [assets.sheetCanvas, `${ASSET_PREFIX}sheetCanvas`],
    // the demo logo of image formations; without a token the JSON panel would drop `formation.image`
    [assets.logoCanvas, `${ASSET_PREFIX}logoCanvas`],
  ]);
}

/**
 * Check Whether a Fire Input Is a List of Bursts.
 *
 * @param input - Fire Input
 * @returns Whether the Input Is an Array
 */
export function isBurstList(input: FireInput): input is readonly FireOptions[] {
  return Array.isArray(input);
}

/**
 * Serialize Fire Input to Pretty JSON.
 * Functions and DOM elements are omitted; demo canvases become `"$asset:…"` placeholders.
 *
 * @param input - Fire Input
 * @param assets - Demo Images
 * @returns JSON Text
 */
export function toJson(input: FireInput, assets: DemoAssets): string {
  const tokens = assetTokens(assets);

  return JSON.stringify(
    input,
    (_key, value: unknown) => {
      if (typeof value === "object" && value !== null) {
        const token = tokens.get(value);

        if (token !== undefined) {
          return token;
        }

        // other runtime objects (elements, bitmaps) cannot round-trip through JSON
        if (value instanceof Element || value instanceof ImageBitmap) {
          return undefined;
        }
      }

      return value;
    },
    2,
  );
}

/**
 * Drop the Hook Keys of One Parsed Burst.
 *
 * @param burst - Parsed Burst (anything else is returned as is)
 * @returns Burst without Hook Keys
 */
function withoutHooks(burst: unknown): unknown {
  return isRecord(burst)
    ? Object.fromEntries(Object.entries(burst).filter(([key]) => !HOOK_KEYS.includes(key)))
    : burst;
}

/**
 * Parse JSON Text Back into Fire Input, Restoring Asset Placeholders.
 * Hook keys are dropped: JSON cannot hold a function, and the library would call any other value.
 *
 * @param text - JSON Text
 * @param assets - Demo Images
 * @returns Fire Input
 */
export function parseJson(text: string, assets: DemoAssets): FireInput {
  const objects = new Map<string, object>();

  for (const [object, token] of assetTokens(assets)) {
    objects.set(token, object);
  }

  const parsed: unknown = JSON.parse(text, (_key, value: unknown) =>
    typeof value === "string" && value.startsWith(ASSET_PREFIX)
      ? (objects.get(value) ?? value)
      : value,
  );

  // json is a user boundary: the library validates the shape at fire time
  return (Array.isArray(parsed) ? parsed.map(withoutHooks) : withoutHooks(parsed)) as FireInput;
}
