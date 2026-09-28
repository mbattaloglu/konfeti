import type { ColorInput } from "konfeti";

import type { ControlState } from "./controlTypes";

/**
 * Read Numeric Control.
 *
 * @param state - Control State
 * @param key - Control Key
 * @returns Number (`0` when missing)
 */
export function num(state: ControlState, key: string): number {
  const value = state[key];

  return typeof value === "number" ? value : Number(value ?? 0);
}

/**
 * Read String Control.
 *
 * @param state - Control State
 * @param key - Control Key
 * @returns Trimmed String
 */
export function str(state: ControlState, key: string): string {
  const value = state[key];

  return typeof value === "string" ? value.trim() : "";
}

/**
 * Read Toggle Control.
 *
 * @param state - Control State
 * @param key - Control Key
 * @returns Whether the Toggle Is On
 */
export function bool(state: ControlState, key: string): boolean {
  return state[key] === true;
}

/**
 * Read Multi-Select Control.
 *
 * @param state - Control State
 * @param key - Control Key
 * @returns Selected Options
 */
export function list(state: ControlState, key: string): readonly string[] {
  const value = state[key];

  return Array.isArray(value) ? (value as readonly string[]) : [];
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

/**
 * Treat a User String as a CSS Color (validated by the library).
 *
 * @param value - Raw Color String
 * @returns Color Input
 */
export function asColor(value: string): ColorInput {
  return value as ColorInput;
}
