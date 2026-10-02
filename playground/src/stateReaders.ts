import type { ControlState, NumberPair } from "./controlTypes";
import { asList, isNumberPair } from "./editor/optionValues";

/**
 * Read Numeric Control.
 *
 * @param state - Control State
 * @param key - Control Key
 * @returns Number (`0` when missing)
 */
export function num(state: Readonly<ControlState>, key: string): number {
  const value = state[key];

  return typeof value === "number" ? value : Number(value ?? 0);
}

/**
 * Read String Control (select values).
 *
 * @param state - Control State
 * @param key - Control Key
 * @returns Trimmed String
 */
export function str(state: Readonly<ControlState>, key: string): string {
  const value = state[key];

  return typeof value === "string" ? value.trim() : "";
}

/**
 * Read String Control Exactly (every string sent to the library).
 *
 * @param state - Control State
 * @param key - Control Key
 * @returns Stored String, Untrimmed (`""` when missing)
 */
export function raw(state: Readonly<ControlState>, key: string): string {
  const value = state[key];

  return typeof value === "string" ? value : "";
}

/**
 * Read Toggle Control.
 *
 * @param state - Control State
 * @param key - Control Key
 * @returns Whether the Toggle Is On
 */
export function bool(state: Readonly<ControlState>, key: string): boolean {
  return state[key] === true;
}

/**
 * Read Multi-Select or Color List Control.
 *
 * @param state - Control State
 * @param key - Control Key
 * @returns Stored List, or Empty when the Value Is Not a List of Strings
 */
export function list(state: Readonly<ControlState>, key: string): readonly string[] {
  const items = asList(state[key]) ?? [];

  return items.every((item): item is string => typeof item === "string") ? items : [];
}

/**
 * Read Span Control.
 *
 * @param state - Control State
 * @param key - Control Key
 * @returns Stored Pair, `[n, n]` for a Stray Number, `[0, 0]` when Missing
 */
export function pair(state: Readonly<ControlState>, key: string): NumberPair {
  const value = state[key];

  if (isNumberPair(value)) {
    return value;
  }

  return typeof value === "number" && Number.isFinite(value) ? [value, value] : [0, 0];
}

/**
 * Split Comma-Separated Text into Trimmed Entries.
 *
 * @param value - Raw Text
 * @returns Non-Empty Entries
 */
export function splitList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry !== "");
}
