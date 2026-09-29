import { Banner } from "../utils/Banner";

/**
 * Turn Off the Console Banner.
 * konfeti logs its version and renderer once per page, when the first instance is created (the shared
 * `Konfeti` on its first `fire()`, or `KonfetiFactory.create()` / `createWorker()`). Call this before that to
 * keep the console silent.
 *
 * @example
 * ```ts
 * import { Konfeti, disableBanner } from "konfeti";
 *
 * disableBanner();
 * Konfeti.fire(); // no console output
 * ```
 */
export function disableBanner(): void {
  Banner.disable();
}
