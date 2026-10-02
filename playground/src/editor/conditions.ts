import type { Control, ControlState } from "../controlTypes";
import { cardOf } from "./controlIndex";
import type { ControlIndex } from "./controlIndex";

/**
 * Check Whether a Control Is Active in a State.
 * Its condition holds, and so does the condition of the control it depends on (the formation text needs the text
 * source, which needs the formation toggle); a card control also needs its card switched on.
 *
 * @param state - Burst or Global State
 * @param key - Control Key
 * @param index - Control Index
 * @param dynamic - Controls Outside the Index (per-card overrides), by Key
 * @returns Active Flag
 */
export function isActiveIn(
  state: Readonly<ControlState>,
  key: string,
  index: ControlIndex,
  dynamic?: ReadonlyMap<string, Control>,
): boolean {
  return isActiveAt(state, key, index, dynamic, 0);
}

/**
 * Check Whether a Control Is Active, Following Its Condition Chain.
 *
 * @param state - Burst or Global State
 * @param key - Control Key
 * @param index - Control Index
 * @param dynamic - Controls Outside the Index, by Key
 * @param depth - Chain Depth (guards against a condition loop)
 * @returns Active Flag
 */
function isActiveAt(
  state: Readonly<ControlState>,
  key: string,
  index: ControlIndex,
  dynamic: ReadonlyMap<string, Control> | undefined,
  depth: number,
): boolean {
  if (depth > index.entries.size) {
    return true;
  }

  const entry = index.entries.get(key);
  const card = cardOf(index, key);

  // the card switch itself is always usable; everything else on a card follows it
  if (card !== null && entry?.isCardSwitch !== true && state[card.enableKey] !== true) {
    return false;
  }

  const when = (entry?.control ?? dynamic?.get(key))?.when;

  if (when === undefined) {
    return true;
  }

  const [parent, expected] = when;

  return state[parent] === expected && isActiveAt(state, parent, index, dynamic, depth + 1);
}
