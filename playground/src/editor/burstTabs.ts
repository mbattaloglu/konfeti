import type { ControlValue } from "../controlTypes";
import { MAX_BURSTS } from "./burstState";
import type { BurstState } from "./burstState";

/**
 * Burst Tabs.
 * Every burst's state, and the index of the one shown in the controls.
 */
export type BurstTabs = {
  /**
   * Burst States in Tab Order (the active slot is stale while its state is live in the controls).
   */
  readonly bursts: readonly BurstState[];
  /**
   * Index of the Shown Burst.
   */
  readonly active: number;
};

/**
 * Create Tabs from a List of Bursts, the First One Shown.
 * At most MAX_BURSTS are kept; an empty list gets the given fallback burst.
 *
 * @param bursts - Burst States
 * @param fallback - Burst Used When the List Is Empty
 * @returns Tabs
 */
export function createTabs(bursts: readonly BurstState[], fallback: BurstState): BurstTabs {
  return { bursts: bursts.length > 0 ? bursts.slice(0, MAX_BURSTS) : [fallback], active: 0 };
}

/**
 * Put the Live State into the Active Slot.
 *
 * @param tabs - Current Tabs
 * @param live - Live State of the Active Burst
 * @returns Burst States in Tab Order
 */
function stored(tabs: BurstTabs, live: BurstState): readonly BurstState[] {
  return tabs.bursts.map((burst, index) => (index === tabs.active ? live : burst));
}

/**
 * Append a Burst and Select It (no change at MAX_BURSTS).
 *
 * @param tabs - Current Tabs
 * @param live - Live State of the Active Burst
 * @param burst - Burst to Append
 * @returns New Tabs
 */
export function addBurst(tabs: BurstTabs, live: BurstState, burst: BurstState): BurstTabs {
  if (tabs.bursts.length >= MAX_BURSTS) {
    return tabs;
  }

  const bursts = [...stored(tabs, live), burst];

  return { bursts, active: bursts.length - 1 };
}

/**
 * Insert a Copy of the Active Burst after It and Select the Copy (no change at MAX_BURSTS).
 *
 * @param tabs - Current Tabs
 * @param live - Live State of the Active Burst
 * @returns New Tabs
 */
export function duplicateBurst(tabs: BurstTabs, live: BurstState): BurstTabs {
  if (tabs.bursts.length >= MAX_BURSTS) {
    return tabs;
  }

  const bursts = [...stored(tabs, live)];
  bursts.splice(tabs.active + 1, 0, live);

  return { bursts, active: tabs.active + 1 };
}

/**
 * Remove the Active Burst (no change with one burst).
 * The tab that took its place is selected; after the last tab, the new last one.
 *
 * @param tabs - Current Tabs
 * @returns New Tabs
 */
export function removeBurst(tabs: BurstTabs): BurstTabs {
  if (tabs.bursts.length <= 1) {
    return tabs;
  }

  const bursts = tabs.bursts.filter((_burst, index) => index !== tabs.active);

  return { bursts, active: Math.min(tabs.active, bursts.length - 1) };
}

/**
 * Store the Live State into the Active Slot and Switch Tabs.
 *
 * @param tabs - Current Tabs
 * @param live - Live State of the Active Burst
 * @param index - Tab to Show (clamped to the tabs)
 * @returns New Tabs
 */
export function selectBurst(tabs: BurstTabs, live: BurstState, index: number): BurstTabs {
  const bursts = stored(tabs, live);

  return { bursts, active: Math.min(Math.max(0, index), bursts.length - 1) };
}

/**
 * List Every Burst, the Live State in the Active Slot.
 *
 * @param tabs - Current Tabs
 * @param live - Live State of the Active Burst
 * @returns Bursts in Tab Order
 */
export function currentBursts(tabs: BurstTabs, live: BurstState): readonly BurstState[] {
  return stored(tabs, live);
}

/**
 * Merge Values into Stored Bursts.
 * Skips the active slot (the live state holds that burst); used by late async writes such as an upload.
 *
 * @param tabs - Current Tabs
 * @param matches - Picks the Bursts to Change
 * @param values - Values to Merge
 * @returns New Tabs
 */
export function patchBursts(
  tabs: BurstTabs,
  matches: (burst: BurstState) => boolean,
  values: Readonly<Record<string, ControlValue>>,
): BurstTabs {
  return {
    ...tabs,
    bursts: tabs.bursts.map((burst, index) =>
      index !== tabs.active && matches(burst) ? { ...burst, ...values } : burst,
    ),
  };
}
