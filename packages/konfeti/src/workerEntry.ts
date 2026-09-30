/**
 * Render in a Web Worker: `import { createWorker } from "konfeti/worker"`.
 * Kept out of the main entries, so their bundles carry no worker code.
 *
 * @module konfeti/worker
 */
import { enableFormations } from "./api/enableFormations";
import { registerShapes } from "./api/registerShapes";
import { BUILTIN_SHAPES } from "./shapes/handlers/BuiltinShapes";

export { createWorker } from "./api/createWorker";
export { WorkerKonfetiInstance } from "./worker/WorkerKonfetiInstance";
export type { Cloneable } from "./types/worker/Cloneable";
export type { WorkerCreateOptions } from "./types/worker/WorkerCreateOptions";
export type { WorkerEmitOptions } from "./types/worker/WorkerEmitOptions";
export type { WorkerFireInput } from "./types/worker/WorkerFireInput";
export type { WorkerFireOptions } from "./types/worker/WorkerFireOptions";
export type { WorkerStats } from "./types/worker/WorkerStats";

// the main-thread fallback (no OffscreenCanvas) draws every built-in shape the worker supports
registerShapes(...BUILTIN_SHAPES);
enableFormations();
