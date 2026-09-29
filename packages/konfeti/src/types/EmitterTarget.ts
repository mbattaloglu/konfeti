import type { OriginPoint } from "./OriginPoint";

/**
 * What a Continuous Emitter Follows.
 * - an **element**: particles start from its center, measured at every emission (so it can move or animate);
 * - `"pointer"`: the mouse / finger position — nothing is emitted until the pointer first moves over the page;
 * - a **normalized point** `{ x, y }` (0–1 of the canvas, ranges allowed), like `fire({ origin })`.
 *
 * @example
 * ```ts
 * Konfeti.emit({ rate: 30, follow: document.querySelector("#rocket")! });
 * Konfeti.emit({ rate: 60, follow: "pointer" });
 * Konfeti.emit({ rate: 20, follow: { x: [0, 1], y: 0 } }); // along the top edge
 * ```
 */
export type EmitterTarget = Element | "pointer" | OriginPoint;
