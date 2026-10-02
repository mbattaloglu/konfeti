import type { ControlState } from "../controlTypes";
import { isActiveIn } from "./conditions";
import type { ControlIndex } from "./controlIndex";
import { sameValue } from "./optionValues";
import { canonicalStyles, stylesKey } from "./overrideGroups";

/**
 * Editor Mode: Basic hides the advanced controls (their values stay active), Advanced shows everything.
 */
export type EditorMode = "basic" | "advanced";

/**
 * Local Storage Key of the Remembered Editor Mode.
 */
export const MODE_STORAGE_KEY = "konfeti-playground:mode";

/**
 * Editor Mode When Nothing Is Remembered.
 */
export const DEFAULT_EDITOR_MODE: EditorMode = "basic";

/**
 * Check Whether a Value Is an Editor Mode.
 *
 * @param value - Any Value
 * @returns Editor Mode Flag
 */
export function isEditorMode(value: unknown): value is EditorMode {
  return value === "basic" || value === "advanced";
}

/**
 * Read the Remembered Editor Mode.
 *
 * @returns Stored Mode, or the Default when Nothing (or Something Else) Is Stored or Storage Is Blocked
 */
export function readEditorMode(): EditorMode {
  try {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);

    return isEditorMode(stored) ? stored : DEFAULT_EDITOR_MODE;
  } catch {
    return DEFAULT_EDITOR_MODE;
  }
}

/**
 * Remember the Editor Mode.
 *
 * @param mode - Editor Mode
 */
export function writeEditorMode(mode: EditorMode): void {
  try {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch {
    // storage may be blocked (private mode); the mode is only a convenience
  }
}

/**
 * Count the Advanced Controls of Some Keys That Are Active and Not at Their Initial.
 *
 * @param state - Burst or Global State
 * @param keys - Keys to Check
 * @param index - Control Index
 * @returns Hidden Active Value Count
 */
function countChanged(
  state: Readonly<ControlState>,
  keys: readonly string[],
  index: ControlIndex,
): number {
  return keys.filter((key) => {
    const entry = index.entries.get(key);
    const value = state[key];

    // a card's own style list is counted per group (countOwnStyles)
    return (
      entry?.advanced === true &&
      !entry.isStyleList &&
      value !== undefined &&
      !sameValue(value, entry.initial) &&
      isActiveIn(state, key, index)
    );
  }).length;
}

/**
 * Count the Own Style Groups of the Switched-On Cards.
 *
 * @param state - Burst State
 * @param index - Control Index
 * @returns Listed Group Count
 */
function countOwnStyles(state: Readonly<ControlState>, index: ControlIndex): number {
  return index.cards
    .filter((card) => state[card.enableKey] === true)
    .reduce(
      (count, card) => count + canonicalStyles(card.prefix, state[stylesKey(card.prefix)]).length,
      0,
    );
}

/**
 * Count the Settings Basic Mode Hides While They Change the Result (the Advanced badge).
 * Per burst: every advanced control that is active there and not at its initial, and every own style group of a
 * switched-on card; then every changed advanced global control (the hooks). Burst tabs show in both modes.
 *
 * @param bursts - Every Burst State
 * @param globals - Global State
 * @param index - Control Index
 * @returns Hidden Active Setting Count
 */
export function countHiddenAdvanced(
  bursts: readonly Readonly<ControlState>[],
  globals: Readonly<ControlState>,
  index: ControlIndex,
): number {
  const perBurst = bursts.reduce(
    (count, burst) =>
      count + countChanged(burst, index.burstKeys, index) + countOwnStyles(burst, index),
    0,
  );

  return perBurst + countChanged(globals, index.globalKeys, index);
}
