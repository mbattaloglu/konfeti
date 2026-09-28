import type { SharedKonfeti } from "../types/SharedKonfeti";
import { DefaultInstance } from "./DefaultInstance";

/**
 * Shared Fullscreen Konfeti.
 * Every call goes to one lazily created fullscreen instance, so importing is SSR-safe and nothing touches the
 * DOM until the first `Konfeti.fire()`.
 *
 * @example
 * ```ts
 * import { Konfeti, presets } from "konfeti";
 *
 * Konfeti.fire();
 * await Konfeti.fire({ particleCount: 150, spread: 90, paper: { colors: ["gold", "white"] } });
 * Konfeti.fire(presets.fireworks());
 * Konfeti.onClick(document.querySelector("#like")!, { particleCount: 30 });
 * Konfeti.reset();
 * ```
 */
export const Konfeti: SharedKonfeti = {
  fire: (input) => DefaultInstance.getInstance().fire(input),
  onClick: (target, options) => DefaultInstance.getInstance().onClick(target, options),
  reset: () => {
    DefaultInstance.peek()?.reset();
  },
  getParticleCount: () => DefaultInstance.peek()?.getParticleCount() ?? 0,
};
