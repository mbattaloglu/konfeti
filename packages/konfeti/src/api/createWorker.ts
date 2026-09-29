import type { WorkerCreateOptions } from "../types/worker/WorkerCreateOptions";
import { WorkerKonfetiInstance } from "../worker/WorkerKonfetiInstance";

/**
 * Create Worker Instance.
 * Simulation and drawing move to a Web Worker (the canvas becomes an `OffscreenCanvas`), so confetti stays
 * smooth while the page is busy. Falls back to the main thread when `OffscreenCanvas` is unsupported.
 * Options must be worker-safe: no hooks, easing functions, `Path2D`, DOM images or `defineShape` /
 * `definePhysics` extensions (see `WorkerFireOptions`).
 *
 * @param canvas - Target Canvas (`null` or omitted creates a fullscreen overlay)
 * @param options - Worker Instance Options
 * @returns Worker Instance
 * @example
 * ```ts
 * import { createWorker } from "konfeti/worker";
 *
 * const stage = createWorker(document.querySelector("canvas"));
 * stage.fire({ particleCount: 400, spread: 360 });
 * stage.isWorker(); // true where OffscreenCanvas is supported
 * ```
 * @remarks Lives in its own entry (`konfeti/worker`), so apps that never render in a worker carry none of
 * this code.
 */
export function createWorker(
  canvas?: HTMLCanvasElement | null,
  options?: WorkerCreateOptions,
): WorkerKonfetiInstance {
  return new WorkerKonfetiInstance(canvas ?? null, options);
}
