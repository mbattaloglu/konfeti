import type { FireOptions } from "./FireOptions";

/**
 * One Burst or Several Bursts Fired Together.
 * An array fires every entry at once and returns one combined handle (presets use this).
 */
export type FireInput = FireOptions | readonly FireOptions[];
