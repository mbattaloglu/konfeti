import type { ControlState } from "../controlTypes";
import { isActiveIn } from "./conditions";
import type { ControlIndex } from "./controlIndex";
import { sameValue } from "./optionValues";

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

    return (
      entry?.advanced === true &&
      value !== undefined &&
      !sameValue(value, entry.initial) &&
      isActiveIn(state, key, index)
    );
  }).length;
}

/**
 * Count the Settings Basic Mode Hides While They Change the Result (the Advanced badge).
 * Per burst: every advanced control that is active there and not at its initial; then one per extra burst, and
 * every changed advanced global control (the hooks).
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
    (count, burst) => count + countChanged(burst, index.burstKeys, index),
    0,
  );

  // every burst tab after the first is an advanced feature too
  return perBurst + Math.max(0, bursts.length - 1) + countChanged(globals, index.globalKeys, index);
}
