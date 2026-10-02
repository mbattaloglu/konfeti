import type { ControlValue } from "../controlTypes";
import {
  applyBurstDiff,
  applyGlobalDiff,
  diffBurst,
  diffGlobals,
  MAX_BURSTS,
} from "../editor/burstState";
import type { BurstState, GlobalState } from "../editor/burstState";
import { asList, isRecord } from "../editor/optionValues";
import { migrateV1 } from "./migrateV1";

/**
 * Shared Settings, Version 2.
 * Decoded links carry untrusted values (`ShareV2<unknown>`) until restoreShared checks them.
 *
 * @typeParam Value - Type of the Diff Values (control values when written, `unknown` when read from a URL)
 */
export type ShareV2<Value = ControlValue> = {
  /**
   * Format Version.
   */
  readonly v: 2;
  /**
   * Per-Burst Diffs (`diffBurst`), 1 to MAX_BURSTS Entries in Tab Order.
   */
  readonly b: readonly Readonly<Record<string, Value>>[];
  /**
   * Global (Hooks) Diff; Omitted When Empty.
   */
  readonly g?: Readonly<Record<string, Value>>;
  /**
   * Preset Shown in the Chip (a `KonfetiPresetName`); Omitted When None.
   */
  readonly p?: string;
};

/**
 * What the URL Carried: a v1 flat diff or v2 settings.
 */
export type SharedSettings =
  | {
      /**
       * Link Format (v1: a flat diff, any link without `v`).
       */
      readonly version: 1;
      /**
       * Changed v1 Control Values (untrusted).
       */
      readonly values: Readonly<Record<string, unknown>>;
    }
  | {
      /**
       * Link Format (v2: the `{ v: 2, b, g?, p? }` envelope).
       */
      readonly version: 2;
      /**
       * Decoded Settings (untrusted values).
       */
      readonly settings: ShareV2<unknown>;
    };

/**
 * Editor State Restored from a Share Link.
 */
export type RestoredSettings = {
  /**
   * Canonical Burst States in Tab Order (at least one).
   */
  readonly bursts: readonly BurstState[];
  /**
   * Global (Hooks) State.
   */
  readonly globals: GlobalState;
  /**
   * Name of the Preset the Editor Held When the Link Was Made (not checked here).
   */
  readonly preset?: string;
};

/**
 * URL Query Parameter Holding Shared Settings.
 */
const PARAM = "s";

/**
 * Longest Share Link the Editor Hands Out.
 * The site's host answers longer URLs (above about 14 KB) with an error, so a link with a large data: URL would
 * never open.
 */
export const MAX_SHARE_URL_LENGTH = 12_000;

/**
 * Current Share Link Format Version.
 */
const SHARE_VERSION = 2;

/**
 * Envelope Field Holding the Format Version (no v1 control is called `v`, so its absence marks a v1 link).
 */
const VERSION_FIELD = "v";

/**
 * Encode Text as Base64url (UTF-8, so emoji and Turkish text survive).
 *
 * @param text - Text
 * @returns URL-Safe Base64 without Padding
 */
function toBase64Url(text: string): string {
  let binary = "";

  for (const byte of new TextEncoder().encode(text)) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Decode Base64url Back to Text.
 *
 * @param encoded - URL-Safe Base64
 * @returns Text
 * @throws Error for malformed input
 */
function fromBase64Url(encoded: string): string {
  const binary = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

/**
 * Check Whether a Diff Holds No Value.
 *
 * @param diff - Values by Key
 * @returns Empty Flag
 */
function isEmpty(diff: Readonly<Record<string, unknown>>): boolean {
  return Object.keys(diff).length === 0;
}

/**
 * Collect What a Share Link Carries for the Editor.
 * Only values that differ from the defaults travel; upload URLs and the derived theme never do (diffBurst).
 *
 * @param bursts - Burst States in Tab Order
 * @param globals - Global (Hooks) State
 * @param preset - Name of the Preset the Editor Holds (the receiver sees its chip)
 * @returns Settings, or Null When Nothing Differs from the Defaults
 */
export function toShareSettings(
  bursts: readonly BurstState[],
  globals: GlobalState,
  preset?: string,
): ShareV2 | null {
  const burstDiffs = bursts.map((burst) => diffBurst(burst));
  const globalDiff = diffGlobals(globals);

  if (
    preset === undefined &&
    burstDiffs.length <= 1 &&
    burstDiffs.every(isEmpty) &&
    isEmpty(globalDiff)
  ) {
    return null;
  }

  return {
    v: SHARE_VERSION,
    b: burstDiffs,
    ...(isEmpty(globalDiff) ? {} : { g: globalDiff }),
    ...(preset === undefined ? {} : { p: preset }),
  };
}

/**
 * Build a Link to This Page Carrying the Given Settings.
 * The language parameter and the hash are dropped, so the link opens in the receiver's own language; other
 * parameters stay.
 *
 * @param settings - Settings, or Null to Remove the `s` Parameter (nothing differs from the defaults)
 * @returns Absolute URL
 */
export function createShareLink(settings: ShareV2 | null): string {
  const url = new URL(location.href);
  url.hash = "";
  url.searchParams.delete("lang");

  if (settings === null) {
    url.searchParams.delete(PARAM);
  } else {
    url.searchParams.set(PARAM, toBase64Url(JSON.stringify(settings)));
  }

  return url.href;
}

/**
 * Check Whether a Share Link Is Short Enough to Open.
 *
 * @param link - Absolute URL
 * @returns Shareable Flag
 */
export function isShareable(link: string): boolean {
  return link.length <= MAX_SHARE_URL_LENGTH;
}

/**
 * Read the v2 Envelope.
 * The burst list must hold 1 to MAX_BURSTS objects; a malformed `g` or `p` is ignored.
 *
 * @param envelope - Parsed Link Object with `v: 2`
 * @returns Settings, or Null for a Malformed Burst List
 */
function readEnvelope(envelope: Readonly<Record<string, unknown>>): SharedSettings | null {
  const bursts = asList(envelope["b"]);

  if (
    bursts === null ||
    bursts.length === 0 ||
    bursts.length > MAX_BURSTS ||
    !bursts.every(isRecord)
  ) {
    return null;
  }

  const globals = envelope["g"];
  const preset = envelope["p"];

  return {
    version: 2,
    settings: {
      v: SHARE_VERSION,
      b: bursts.map((burst) => ({ ...burst })),
      ...(isRecord(globals) ? { g: { ...globals } } : {}),
      ...(typeof preset === "string" ? { p: preset } : {}),
    },
  };
}

/**
 * Read Shared Settings from the Current URL.
 * A broken or foreign value is ignored rather than failing the page.
 *
 * @returns Settings, or Null When the URL Carries None (or a broken value)
 */
export function readShareLink(): SharedSettings | null {
  const encoded = new URLSearchParams(location.search).get(PARAM);

  if (encoded === null || encoded === "") {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(fromBase64Url(encoded));

    if (!isRecord(parsed)) {
      return null;
    }

    if (!Object.hasOwn(parsed, VERSION_FIELD)) {
      // outside input: keep only plain entries; the migration checks every value again
      return { version: 1, values: { ...parsed } };
    }

    // a version this page does not know (a later deploy) is not guessed at
    return parsed[VERSION_FIELD] === SHARE_VERSION ? readEnvelope(parsed) : null;
  } catch {
    return null;
  }
}

/**
 * Turn Shared Settings into Editor State.
 * Every value passes the controls' checks (acceptValue): a crafted link cannot bring in an upload URL, an unsorted
 * pair, a value outside a domain or an option a control does not offer. v1 links are migrated (migrateV1).
 *
 * @param shared - Settings Read from the URL
 * @returns Canonical Bursts and the Global State
 */
export function restoreShared(shared: SharedSettings): RestoredSettings {
  if (shared.version === 1) {
    const migrated = migrateV1(shared.values);

    return { bursts: [migrated.burst], globals: migrated.globals };
  }

  return {
    bursts: shared.settings.b.map((diff) => applyBurstDiff(diff)),
    globals: applyGlobalDiff(shared.settings.g ?? {}),
    ...(shared.settings.p === undefined ? {} : { preset: shared.settings.p }),
  };
}
