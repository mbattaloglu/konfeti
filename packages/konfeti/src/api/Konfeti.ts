import type { SharedKonfeti } from "../types/SharedKonfeti";
import { DefaultInstance } from "./DefaultInstance";

/**
 * Shared Fullscreen Konfeti.
 * Every call goes to one lazily created fullscreen instance, so importing is SSR-safe and nothing touches the
 * DOM until the first `Konfeti.fire()`.
 *
 * @example
 * ```ts
 * import { Konfeti, KonfetiPresets } from "konfeti";
 *
 * Konfeti.fire();
 * await Konfeti.fire({ particleCount: 150, spread: 90, paper: { colors: ["gold", "white"] } });
 * Konfeti.fire(KonfetiPresets.FIREWORKS);
 * Konfeti.onClick(document.querySelector("#like")!, { particleCount: 30 });
 * Konfeti.reset();
 * ```
 */
export const Konfeti: SharedKonfeti = {
  fire: (input) => DefaultInstance.getInstance().fire(input),
  onClick: (target, options, settings) =>
    DefaultInstance.getInstance().onClick(target, options, settings),
  pause: () => {
    DefaultInstance.getInstance().pause();
  },
  resume: () => {
    DefaultInstance.peek()?.resume();
  },
  isPaused: () => DefaultInstance.peek()?.isPaused() ?? false,
  reset: () => {
    DefaultInstance.peek()?.reset();
  },
  getParticleCount: () => DefaultInstance.peek()?.getParticleCount() ?? 0,
};
