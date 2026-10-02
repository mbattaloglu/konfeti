import { CONTROL_SECTIONS } from "../controls";
import type { ControlState, ControlValue, NumberPair } from "../controlTypes";
import { list } from "../stateReaders";
import { createControlIndex } from "./controlIndex";
import type { ControlEntry } from "./controlIndex";
import { asList, deriveTheme, hexOf, inDomain, isNumberPair, sameValue } from "./optionValues";

export { deriveTheme } from "./optionValues";

/**
 * Most Bursts in the Editor.
 * Keeps share links short; the longest preset list, REALISTIC, has 5.
 */
export const MAX_BURSTS = 8;

/**
 * One Burst's Control Values.
 * The canonical form (normalizeBurst) holds every per-burst key and the theme derived from the colors.
 */
export type BurstState = Readonly<ControlState>;

/**
 * Global Control Values (the hooks section, shared by every burst).
 */
export type GlobalState = Readonly<ControlState>;

/**
 * Index of the Playground Control Table (keys, initials, options and domains do not depend on the language).
 */
export const CONTROL_INDEX = createControlIndex(CONTROL_SECTIONS);

/**
 * State Key of the Derived Color Theme.
 */
const THEME_KEY = "colorTheme";

/**
 * State Key of the Colors the Theme Is Derived From.
 */
const COLORS_KEY = "colors";

/**
 * Return the Initial Value of a Static Key.
 *
 * @param key - State Key
 * @returns Initial Value, or Undefined for an Unknown Key
 */
function initialValueOf(key: string): ControlValue | undefined {
  return CONTROL_INDEX.entries.get(key)?.initial;
}

/**
 * Put a State into the Canonical Burst Form.
 * Every per-burst key is present (a missing one at its initial), other keys are dropped, and the color theme is
 * derived from the colors. The loader, share-link restore and the live state all compare in this form.
 *
 * @param state - Burst Values (possibly partial)
 * @returns Canonical Burst State
 */
export function normalizeBurst(state: Readonly<Partial<ControlState>>): BurstState {
  const burst: ControlState = {};

  for (const key of CONTROL_INDEX.burstKeys) {
    const value = state[key] ?? initialValueOf(key);

    if (value !== undefined) {
      burst[key] = value;
    }
  }

  burst[THEME_KEY] = deriveTheme(list(burst, COLORS_KEY));

  return burst;
}

/**
 * Return a Burst at Its Initial Values (the library defaults).
 *
 * @returns Canonical Burst State
 */
export function initialBurst(): BurstState {
  return normalizeBurst({});
}

/**
 * Return the Global Values at Their Initials.
 *
 * @returns Global State
 */
export function initialGlobals(): GlobalState {
  const globals: ControlState = {};

  for (const key of CONTROL_INDEX.globalKeys) {
    const value = initialValueOf(key);

    if (value !== undefined) {
      globals[key] = value;
    }
  }

  return globals;
}

/**
 * Sort a Pair (a crafted `[5, 1]` reads as `[1, 5]`, as the library would read it).
 *
 * @param pair - Number Pair
 * @returns Sorted Pair
 */
function sortedPair(pair: NumberPair): NumberPair {
  return pair[0] <= pair[1] ? [pair[0], pair[1]] : [pair[1], pair[0]];
}

/**
 * Read a List of Strings.
 *
 * @param value - Untrusted Value
 * @returns The Strings, or Null when the Value Is Not a List of Strings
 */
function stringList(value: unknown): readonly string[] | null {
  const items = asList(value);

  if (items === null) {
    return null;
  }

  return items.every((item): item is string => typeof item === "string") ? items : null;
}

/**
 * Check an Untrusted Value for One Control (share links, the v1 migration).
 * Upload URLs, values of the wrong kind, values outside the control's domain and options the control does not
 * offer are refused.
 *
 * @param entry - Indexed Control
 * @param value - Untrusted Value
 * @returns The Value in State Form (pairs sorted, colors as lowercase `#rrggbb`), or Null to Keep the Initial
 */
export function acceptValue(entry: ControlEntry, value: unknown): ControlValue | null {
  if (entry.local) {
    return null;
  }

  const control = entry.control;

  switch (control.kind) {
    case "toggle":
      return typeof value === "boolean" ? value : null;
    case "range":
      return typeof value === "number" && inDomain(entry.domain, value) ? value : null;
    case "span": {
      const pair = isNumberPair(value) ? sortedPair(value) : null;

      return pair !== null && inDomain(entry.domain, pair) ? pair : null;
    }
    case "select":
      return typeof value === "string" && entry.options.includes(value) ? value : null;
    case "chips": {
      const items = stringList(value);

      return items !== null &&
        new Set(items).size === items.length &&
        items.every((item) => entry.options.includes(item))
        ? items
        : null;
    }
    case "color":
      return hexOf(value);
    case "palette": {
      const colors = asList(value)?.map(hexOf) ?? null;

      return colors !== null &&
        colors.length >= (control.minItems ?? 0) &&
        colors.every((color): color is string => color !== null)
        ? colors
        : null;
    }
    case "text":
      return typeof value === "string" ? value : null;
    case "file":
      return null;
  }
}

/**
 * Return the Values of Some Keys That Differ from Their Initials.
 *
 * @param state - Burst or Global State
 * @param keys - Keys to Compare
 * @returns Changed Values (upload URLs and derived values left out)
 */
function diffKeys(
  state: Readonly<ControlState>,
  keys: readonly string[],
): Record<string, ControlValue> {
  const diff: Record<string, ControlValue> = {};

  for (const key of keys) {
    const entry = CONTROL_INDEX.entries.get(key);
    const value = state[key];

    if (
      entry !== undefined &&
      !entry.local &&
      !entry.derived &&
      value !== undefined &&
      !sameValue(value, entry.initial)
    ) {
      diff[key] = value;
    }
  }

  return diff;
}

/**
 * Accept the Known Keys of an Untrusted Diff into a State.
 *
 * @param state - State to Write Into (starts at the initials)
 * @param diff - Untrusted Values by Key
 * @param global - Accept Global Keys (else per-burst keys)
 */
function acceptDiff(
  state: ControlState,
  diff: Readonly<Record<string, unknown>>,
  global: boolean,
): void {
  for (const [key, value] of Object.entries(diff)) {
    const entry = CONTROL_INDEX.entries.get(key);
    // only known keys of the right scope are restored; a derived value is recomputed instead
    const accepted = entry?.global === global && !entry.derived ? acceptValue(entry, value) : null;

    if (accepted !== null) {
      state[key] = accepted;
    }
  }
}

/**
 * Return What a Share Link Needs to Restore a Burst.
 *
 * @param state - Burst State
 * @returns Per-Burst Values That Differ from Their Initials (no upload URLs, no derived theme)
 */
export function diffBurst(state: BurstState): Record<string, ControlValue> {
  return diffKeys(state, CONTROL_INDEX.burstKeys);
}

/**
 * Restore a Burst from an Untrusted Diff (share links, the v1 migration).
 * Every value passes acceptValue; unknown keys are dropped and refused values keep their initials.
 *
 * @param diff - Untrusted Values by Key
 * @returns Canonical Burst State
 */
export function applyBurstDiff(diff: Readonly<Record<string, unknown>>): BurstState {
  const burst: ControlState = { ...initialBurst() };
  acceptDiff(burst, diff, false);

  return normalizeBurst(burst);
}

/**
 * Return What a Share Link Needs to Restore the Global Values.
 *
 * @param globals - Global State
 * @returns Global Values That Differ from Their Initials
 */
export function diffGlobals(globals: GlobalState): Record<string, ControlValue> {
  return diffKeys(globals, CONTROL_INDEX.globalKeys);
}

/**
 * Restore the Global Values from an Untrusted Diff.
 *
 * @param diff - Untrusted Values by Key
 * @returns Global State
 */
export function applyGlobalDiff(diff: Readonly<Record<string, unknown>>): GlobalState {
  const globals: ControlState = { ...initialGlobals() };
  acceptDiff(globals, diff, true);

  return globals;
}

/**
 * Return the Keys of a State That Are Compared (derived keys follow other keys and are skipped).
 *
 * @param state - Burst State
 * @returns Compared Keys
 */
function comparedKeys(state: BurstState): readonly string[] {
  return Object.keys(state).filter((key) => CONTROL_INDEX.entries.get(key)?.derived !== true);
}

/**
 * Compare Two Bursts by Key Set and Value, Independent of Key Order.
 * The derived theme is skipped: it follows the colors, so it never makes a burst differ on its own.
 *
 * @param a - First Burst
 * @param b - Second Burst
 * @returns Equal Flag
 */
export function sameBurst(a: BurstState, b: BurstState): boolean {
  const keys = comparedKeys(a);

  return (
    keys.length === comparedKeys(b).length &&
    keys.every((key) => {
      const first = a[key];
      const second = b[key];

      return first !== undefined && second !== undefined && sameValue(first, second);
    })
  );
}

/**
 * Compare Two Burst Lists Burst by Burst.
 *
 * @param a - First Bursts
 * @param b - Second Bursts
 * @returns Equal Flag
 */
export function sameBursts(a: readonly BurstState[], b: readonly BurstState[]): boolean {
  return (
    a.length === b.length &&
    a.every((burst, index) => {
      const other = b[index];

      return other !== undefined && sameBurst(burst, other);
    })
  );
}
