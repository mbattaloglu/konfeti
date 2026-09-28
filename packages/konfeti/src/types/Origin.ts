import type { ClientPoint } from "./ClientPoint";
import type { OriginPoint } from "./OriginPoint";

/**
 * Spawn Origin.
 * - {@link OriginPoint} — normalized canvas position (ranges spawn along a line/area).
 * - `Element` — the element's center, measured at every emission (follows moving elements).
 * - {@link ClientPoint} — a viewport position, e.g. the click event itself.
 *
 * @example
 * ```ts
 * origin: { x: 0.5, y: 1 }
 * origin: document.querySelector("#buy-button")!
 * origin: clickEvent
 * ```
 */
export type Origin = OriginPoint | Element | ClientPoint;
